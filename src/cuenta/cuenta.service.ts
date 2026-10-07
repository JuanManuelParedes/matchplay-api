import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../auth/users.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { PreferenciasDeportivasDto } from './dto/preferencias-deportivas.dto';
import { HorarioDisponibleDto } from './dto/horario-disponible.dto';
import { ActualizarNotificacionesDto } from './dto/preferencias-notificaciones.dto';
import { ActualizarPrivacidadDto } from './dto/preferencias-privacidad.dto';
import { ActualizarIdiomaDto, ActualizarTemaDto } from './dto/idioma-tema.dto';
import { Usuario } from '../auth/entities/usuario.entity';

/**
 * Todo este servicio es "leer y escribir configuración del usuario
 * autenticado": no hay máquina de estados como en Eventos. Por eso cada
 * método es corto — la complejidad real está en mapear los nombres de
 * campo entre la entidad interna y la forma de cada schema del spec.
 */
@Injectable()
export class CuentaService {
  constructor(private readonly usersService: UsersService) {}

  private obtener(usuarioId: string): Usuario {
    const usuario = this.usersService.buscarPorId(usuarioId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  // ---------- GET/PATCH/DELETE /me ----------

  perfilPropio(usuarioId: string) {
    return this.aPerfilPropio(this.obtener(usuarioId));
  }

  actualizarPerfil(usuarioId: string, cambios: ActualizarPerfilDto) {
    const actualizado = this.usersService.actualizar(usuarioId, cambios);
    return this.aPerfilPropio(actualizado!);
  }

  eliminarCuenta(usuarioId: string) {
    this.obtener(usuarioId); // valida que exista antes de borrar
    this.usersService.eliminar(usuarioId);
  }

  descargarDatos(usuarioId: string) {
    const { passwordHash, ...resto } = this.obtener(usuarioId);
    return resto;
  }

  // ---------- Preferencias deportivas ----------

  obtenerPreferenciasDeportivas(usuarioId: string) {
    const u = this.obtener(usuarioId);
    return {
      deportesFavoritos: u.deportesFavoritos,
      nivel: u.nivel,
      radioBusquedaKm: u.radioBusquedaKm,
    };
  }

  actualizarPreferenciasDeportivas(
    usuarioId: string,
    datos: PreferenciasDeportivasDto,
  ) {
    this.usersService.actualizar(usuarioId, datos);
    return this.obtenerPreferenciasDeportivas(usuarioId);
  }

  // ---------- Horario disponible ----------

  obtenerHorario(usuarioId: string) {
    return this.obtener(usuarioId).horarioDisponible;
  }

  actualizarHorario(usuarioId: string, datos: HorarioDisponibleDto) {
    this.usersService.actualizar(usuarioId, { horarioDisponible: datos });
    return this.obtenerHorario(usuarioId);
  }

  // ---------- Notificaciones ----------

  obtenerNotificaciones(usuarioId: string) {
    return this.obtener(usuarioId).notificaciones;
  }

  actualizarNotificaciones(usuarioId: string, cambios: ActualizarNotificacionesDto) {
    const u = this.obtener(usuarioId);
    u.notificaciones = { ...u.notificaciones, ...cambios };
    return u.notificaciones;
  }

  // ---------- Privacidad ----------

  obtenerPrivacidad(usuarioId: string) {
    return this.obtener(usuarioId).privacidad;
  }

  actualizarPrivacidad(usuarioId: string, cambios: ActualizarPrivacidadDto) {
    const u = this.obtener(usuarioId);
    u.privacidad = { ...u.privacidad, ...cambios };
    return u.privacidad;
  }

  // ---------- Bloqueados ----------

  listarBloqueados(usuarioId: string) {
    const u = this.obtener(usuarioId);
    return u.bloqueadosIds
      .map((id) => this.usersService.buscarPorId(id))
      .filter((perfil): perfil is NonNullable<typeof perfil> => Boolean(perfil))
      .map((perfil) => ({
        id: perfil.id,
        nombre: perfil.nombreUsuario,
        edad: perfil.edad,
        fotoUrl: perfil.fotoUrl,
      }));
  }

  bloquear(usuarioId: string, perfilId: string) {
    if (perfilId === usuarioId) {
      throw new BadRequestException('No puedes bloquearte a ti mismo');
    }
    const existe = this.usersService.buscarPorId(perfilId);
    if (!existe) throw new NotFoundException('Perfil no encontrado');

    const u = this.obtener(usuarioId);
    if (!u.bloqueadosIds.includes(perfilId)) {
      u.bloqueadosIds.push(perfilId);
    }
    return this.listarBloqueados(usuarioId);
  }

  desbloquear(usuarioId: string, perfilId: string) {
    const u = this.obtener(usuarioId);
    u.bloqueadosIds = u.bloqueadosIds.filter((id) => id !== perfilId);
  }

  // ---------- Idioma / Tema ----------

  actualizarIdioma(usuarioId: string, datos: ActualizarIdiomaDto) {
    this.usersService.actualizar(usuarioId, { idioma: datos.idioma });
    return { idioma: datos.idioma };
  }

  actualizarTema(usuarioId: string, datos: ActualizarTemaDto) {
    this.usersService.actualizar(usuarioId, { tema: datos.tema });
    return { tema: datos.tema };
  }

  /** Mapea la entidad interna a la forma del schema PerfilPropio. */
  private aPerfilPropio(u: Usuario) {
    return {
      id: u.id,
      nombre: u.nombreUsuario,
      edad: u.edad,
      fotoUrl: u.fotoUrl,
      deporte: u.deportesFavoritos[0],
      nivel: u.nivel,
      nombreCompleto: u.nombreCompleto,
      nombreUsuario: u.nombreUsuario,
      correo: u.correo,
      ciudad: u.ciudad,
      sobreMi: u.sobreMi,
      estadisticas: u.estadisticas,
    };
  }
}
