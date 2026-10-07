import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { EventosService } from './eventos.service';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';
import { UsersService } from '../auth/users.service';
import { Evento } from './entities/evento.entity';

/** Tag "Eventos" del spec: 9 operaciones sobre /eventos. */
@ApiTags('Eventos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eventos')
export class EventosController {
  constructor(
    private readonly eventosService: EventosService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos publicados (Solicitudes / Eventos)' })
  listar(
    @Query('tipo') tipo?: 'personal' | 'comunidad',
    @Query('deporte') deporte?: string,
  ) {
    return this.eventosService
      .listarPublicados(tipo, deporte)
      .map((e) => this.aRespuesta(e));
  }

  @Get('mios')
  @ApiOperation({ summary: 'Listar los eventos que yo organicé' })
  listarMios(@CurrentUser() usuario: JwtPayload) {
    return this.eventosService
      .listarMios(usuario.sub)
      .map((e) => this.aRespuesta(e));
  }

  @Post()
  @ApiOperation({ summary: 'Crear evento (queda en borrador)' })
  crear(@Body() datos: CrearEventoDto, @CurrentUser() usuario: JwtPayload) {
    return this.aRespuesta(this.eventosService.crear(usuario.sub, datos));
  }

  @Get(':eventoId')
  @ApiOperation({ summary: 'Ver el detalle de un evento' })
  obtenerUno(@Param('eventoId') eventoId: string) {
    return this.aRespuesta(this.eventosService.obtenerUno(eventoId));
  }

  @Patch(':eventoId')
  @ApiOperation({ summary: 'Editar un evento propio' })
  actualizar(
    @Param('eventoId') eventoId: string,
    @Body() cambios: ActualizarEventoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(
      this.eventosService.actualizar(eventoId, usuario.sub, cambios),
    );
  }

  @Post(':eventoId/publicar')
  @ApiOperation({ summary: 'Publicar un evento en borrador' })
  publicar(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(
      this.eventosService.publicar(eventoId, usuario.sub),
    );
  }

  @Post(':eventoId/cancelar')
  @ApiOperation({ summary: 'Cancelar un evento propio' })
  cancelar(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(
      this.eventosService.cancelar(eventoId, usuario.sub),
    );
  }

  @Post(':eventoId/join')
  @ApiOperation({ summary: 'Unirme a un evento (autoservicio, sin invitación)' })
  unirse(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(this.eventosService.unirse(eventoId, usuario.sub));
  }

  @Delete(':eventoId/join')
  @HttpCode(204)
  @ApiOperation({ summary: 'Salir de un evento al que me uní' })
  salir(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    this.eventosService.salir(eventoId, usuario.sub);
  }

  @Get(':eventoId/participantes')
  @ApiOperation({ summary: 'Listar los participantes confirmados' })
  participantes(@Param('eventoId') eventoId: string) {
    return this.eventosService
      .participantesIds(eventoId)
      .map((id) => this.usersService.buscarPorId(id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((u) => ({
        id: u.id,
        nombre: u.nombreUsuario,
        edad: u.edad,
        fotoUrl: u.fotoUrl,
        nivel: u.nivel,
      }));
  }

  /** Mapea la entidad interna a la forma del schema `Evento` del spec. */
  private aRespuesta(evento: Evento) {
    return {
      id: evento.id,
      tipo: evento.tipo,
      titulo: evento.titulo,
      deporte: evento.deporte,
      fechaHora: evento.fechaHora,
      lugar: evento.lugar,
      cupoMaximo: evento.cupoMaximo,
      nivelRequerido: evento.nivelRequerido,
      descripcion: evento.descripcion,
      fotoUrl: evento.fotoUrl,
      estado: evento.estado,
      creadorId: evento.creadorId,
      cuposOcupados: this.eventosService.cuposOcupados(evento),
      calificacionPromedio: evento.calificacionPromedio,
    };
  }
}
