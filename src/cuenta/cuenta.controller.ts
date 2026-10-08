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

/** 17 operaciones, todas bajo /me. */
@UseGuards(JwtAuthGuard)
@Controller('me')
export class CuentaController {
  constructor(private readonly cuentaService: CuentaService) {}

  @Get()
  perfilPropio(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.perfilPropio(usuario.sub);
  }

  @Patch()
  actualizarPerfil(
    @Body() datos: ActualizarPerfilDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarPerfil(usuario.sub, datos);
  }

  @Delete()
  @HttpCode(204)
  eliminarCuenta(@CurrentUser() usuario: JwtPayload) {
    this.cuentaService.eliminarCuenta(usuario.sub);
  }

  @Get('datos')
  descargarDatos(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.descargarDatos(usuario.sub);
  }

  @Get('preferencias-deportivas')
  obtenerPreferenciasDeportivas(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerPreferenciasDeportivas(usuario.sub);
  }

  @Put('preferencias-deportivas')
  actualizarPreferenciasDeportivas(
    @Body() datos: PreferenciasDeportivasDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarPreferenciasDeportivas(usuario.sub, datos);
  }

  @Get('horario-disponible')
  obtenerHorario(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerHorario(usuario.sub);
  }

  @Put('horario-disponible')
  actualizarHorario(
    @Body() datos: HorarioDisponibleDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarHorario(usuario.sub, datos);
  }

  @Get('notificaciones')
  obtenerNotificaciones(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerNotificaciones(usuario.sub);
  }

  @Patch('notificaciones')
  actualizarNotificaciones(
    @Body() datos: ActualizarNotificacionesDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarNotificaciones(usuario.sub, datos);
  }

  @Get('privacidad')
  obtenerPrivacidad(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.obtenerPrivacidad(usuario.sub);
  }

  @Patch('privacidad')
  actualizarPrivacidad(
    @Body() datos: ActualizarPrivacidadDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarPrivacidad(usuario.sub, datos);
  }

  @Get('bloqueados')
  listarBloqueados(@CurrentUser() usuario: JwtPayload) {
    return this.cuentaService.listarBloqueados(usuario.sub);
  }

  @Post('bloqueados')
  bloquear(
    @Body() datos: BloquearPerfilDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.bloquear(usuario.sub, datos.perfilId);
  }

  @Delete('bloqueados/:perfilId')
  @HttpCode(204)
  desbloquear(
    @Param('perfilId') perfilId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    this.cuentaService.desbloquear(usuario.sub, perfilId);
  }

  @Put('idioma')
  actualizarIdioma(
    @Body() datos: ActualizarIdiomaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarIdioma(usuario.sub, datos);
  }

  @Put('tema')
  actualizarTema(
    @Body() datos: ActualizarTemaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.cuentaService.actualizarTema(usuario.sub, datos);
  }
}
