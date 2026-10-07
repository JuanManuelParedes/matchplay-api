import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CuentaService } from './cuenta.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { PreferenciasDeportivasDto } from './dto/preferencias-deportivas.dto';
import { HorarioDisponibleDto } from './dto/horario-disponible.dto';
import { ActualizarNotificacionesDto } from './dto/preferencias-notificaciones.dto';
import { ActualizarPrivacidadDto } from './dto/preferencias-privacidad.dto';
import { ActualizarIdiomaDto, ActualizarTemaDto } from './dto/idioma-tema.dto';
import { BloquearPerfilDto } from './dto/bloquear-perfil.dto';

/** Tag "Cuenta" del spec: 17 operaciones, todas bajo /me. */
@ApiTags('Cuenta')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class CuentaController {
  constructor(private readonly cuentaService: CuentaService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener mi perfil' })
  perfilPropio(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.perfilPropio(usuario.sub);
  }

  @Patch()
  @ApiOperation({ summary: 'Editar mi perfil' })
  actualizarPerfil(
    @Body() datos: ActualizarPerfilDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarPerfil(usuario.sub, datos);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar mi cuenta (irreversible)' })
  eliminarCuenta(@CurrentUser() usuario: JwtPayload) {
    this.cuentaService.eliminarCuenta(usuario.sub);
  }

  @Get('datos')
  @ApiOperation({ summary: 'Descargar mis datos' })
  descargarDatos(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.descargarDatos(usuario.sub);
  }

  @Get('preferencias-deportivas')
  @ApiOperation({ summary: 'Ver mis preferencias deportivas' })
  obtenerPreferenciasDeportivas(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerPreferenciasDeportivas(usuario.sub);
  }

  @Put('preferencias-deportivas')
  @ApiOperation({ summary: 'Actualizar mis preferencias deportivas' })
  actualizarPreferenciasDeportivas(
    @Body() datos: PreferenciasDeportivasDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarPreferenciasDeportivas(usuario.sub, datos);
  }

  @Get('horario-disponible')
  @ApiOperation({ summary: 'Ver mi horario disponible' })
  obtenerHorario(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerHorario(usuario.sub);
  }

  @Put('horario-disponible')
  @ApiOperation({ summary: 'Actualizar mi horario disponible' })
  actualizarHorario(
    @Body() datos: HorarioDisponibleDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarHorario(usuario.sub, datos);
  }

  @Get('notificaciones')
  @ApiOperation({ summary: 'Ver mis preferencias de notificaciones' })
  obtenerNotificaciones(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerNotificaciones(usuario.sub);
  }

  @Patch('notificaciones')
  @ApiOperation({ summary: 'Actualizar mis preferencias de notificaciones' })
  actualizarNotificaciones(
    @Body() datos: ActualizarNotificacionesDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarNotificaciones(usuario.sub, datos);
  }

  @Get('privacidad')
  @ApiOperation({ summary: 'Ver mis preferencias de privacidad' })
  obtenerPrivacidad(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerPrivacidad(usuario.sub);
  }

  @Patch('privacidad')
  @ApiOperation({ summary: 'Actualizar mis preferencias de privacidad' })
  actualizarPrivacidad(
    @Body() datos: ActualizarPrivacidadDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarPrivacidad(usuario.sub, datos);
  }

  @Get('bloqueados')
  @ApiOperation({ summary: 'Listar perfiles bloqueados' })
  listarBloqueados(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.listarBloqueados(usuario.sub);
  }

  @Post('bloqueados')
  @ApiOperation({ summary: 'Bloquear un perfil' })
  bloquear(
    @Body() datos: BloquearPerfilDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.bloquear(usuario.sub, datos.perfilId);
  }

  @Delete('bloqueados/:perfilId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Desbloquear un perfil' })
  desbloquear(
    @Param('perfilId') perfilId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    this.cuentaService.desbloquear(usuario.sub, perfilId);
  }

  @Put('idioma')
  @ApiOperation({ summary: 'Cambiar el idioma de la aplicación' })
  actualizarIdioma(
    @Body() datos: ActualizarIdiomaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarIdioma(usuario.sub, datos);
  }

  @Put('tema')
  @ApiOperation({ summary: 'Cambiar el tema visual de la aplicación' })
  actualizarTema(
    @Body() datos: ActualizarTemaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarTema(usuario.sub, datos);
  }
}
