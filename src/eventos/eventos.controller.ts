import {
  BadRequestException,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { EventosService } from './eventos.service';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';
import { UsersService } from '../auth/users.service';
import { EstadoEvento, Evento } from './entities/evento.entity';

const ROLES_MIOS = ['creador', 'participante'];
const ESTADOS = ['borrador', 'publicado', 'cancelado', 'finalizado'];

/** 9 operaciones sobre /eventos. */
@UseGuards(JwtAuthGuard)
@Controller('eventos')
export class EventosController {
  constructor(
    private readonly eventosService: EventosService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  listar(
    @Query('tipo') tipo?: 'personal' | 'comunidad',
    @Query('deporte') deporte?: string,
  ) {
    return this.eventosService
      .listarPublicados(tipo, deporte)
      .map((e) => this.aRespuesta(e));
  }

  @Get('mios')
  listarMios(
    @CurrentUser() usuario: JwtPayload,
    @Query('rol') rol?: string,
    @Query('estado') estado?: string,
  ) {
    if (rol !== undefined && !ROLES_MIOS.includes(rol)) {
      throw new BadRequestException('rol debe ser creador o participante');
    }
    if (estado !== undefined && !ESTADOS.includes(estado)) {
      throw new BadRequestException(`estado debe ser uno de: ${ESTADOS.join(', ')}`);
    }
    return this.eventosService
      .listarMios(
        usuario.sub,
        rol as 'creador' | 'participante' | undefined,
        estado as EstadoEvento | undefined,
      )
      .map((e) => this.aRespuesta(e));
  }

  @Post()
  crear(@Body() datos: CrearEventoDto, @CurrentUser() usuario: JwtPayload) {
    return this.aRespuesta(this.eventosService.crear(usuario.sub, datos));
  }

  @Get(':eventoId')
  obtenerUno(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(
      this.eventosService.obtenerVisible(eventoId, usuario.sub),
    );
  }

  @Patch(':eventoId')
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
  publicar(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(
      this.eventosService.publicar(eventoId, usuario.sub),
    );
  }

  @Post(':eventoId/cancelar')
  cancelar(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(
      this.eventosService.cancelar(eventoId, usuario.sub),
    );
  }

  @Post(':eventoId/join')
  unirse(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.aRespuesta(this.eventosService.unirse(eventoId, usuario.sub));
  }

  @Delete(':eventoId/join')
  @HttpCode(204)
  salir(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    this.eventosService.salir(eventoId, usuario.sub);
  }

  @Get(':eventoId/participantes')
  participantes(
    @Param('eventoId') eventoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.eventosService
      .participantesIds(eventoId, usuario.sub)
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

  /** Convierte el evento interno en la respuesta que se devuelve al cliente */
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
