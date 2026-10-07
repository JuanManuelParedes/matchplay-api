/**
 * Entidad interna de usuario. Corresponde a los schemas `Perfil` +
 * `PerfilPropio` de matchplay-api-unificada, pero incluye además el hash
 * de la contraseña, que nunca se expone en las respuestas de la API.
 *
 * NOTA: por ahora vive en memoria (un arreglo en UsersService). El único
 * cambio para pasar a una base de datos real es reemplazar UsersService
 * por un repositorio de TypeORM/Prisma que implemente los mismos métodos.
 */
export type NivelJuego = 'Principiante' | 'Intermedio' | 'Avanzado';
export type DiaSemana =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo';
export type FranjaHoraria = 'Mañana' | 'Tarde' | 'Noche';
export type Idioma = 'es' | 'en' | 'pt';
export type Tema = 'oscuro' | 'claro' | 'automatico';

export interface PreferenciasNotificaciones {
  nuevasSolicitudes: boolean;
  mensajesNuevos: boolean;
  recordatorioPartido: boolean;
  nuevosEventosCerca: boolean;
  cuposCasiLlenos: boolean;
  cambiosEnEventos: boolean;
  novedadesYPromociones: boolean;
}

export interface PreferenciasPrivacidad {
  perfilVisibleEnBusqueda: boolean;
  mostrarEdad: boolean;
  mostrarUbicacionExacta: boolean;
  verificacionPerfil: 'pendiente' | 'verificado';
}

export interface Usuario {
  id: string;
  nombreUsuario: string;
  correo: string;
  passwordHash: string;
  nombreCompleto?: string;
  edad: number;
  ciudad?: string;
  sobreMi?: string;
  fotoUrl?: string;
  deportesFavoritos: string[];
  nivel: NivelJuego;
  radioBusquedaKm: number;
  horarioDisponible: {
    dias: DiaSemana[];
    franjaHoraria?: FranjaHoraria;
    notas?: string;
  };
  notificaciones: PreferenciasNotificaciones;
  privacidad: PreferenciasPrivacidad;
  bloqueadosIds: string[];
  idioma: Idioma;
  tema: Tema;
  estadisticas: {
    partidosJugados: number;
    calificacion: number;
    eventosOrganizados: number;
  };
  creadoEn: Date;
}

/** Valores por defecto al registrar un usuario nuevo. */
export const PREFERENCIAS_POR_DEFECTO = {
  radioBusquedaKm: 10,
  horarioDisponible: { dias: [] as DiaSemana[] },
  notificaciones: {
    nuevasSolicitudes: true,
    mensajesNuevos: true,
    recordatorioPartido: true,
    nuevosEventosCerca: true,
    cuposCasiLlenos: false,
    cambiosEnEventos: true,
    novedadesYPromociones: false,
  } satisfies PreferenciasNotificaciones,
  privacidad: {
    perfilVisibleEnBusqueda: true,
    mostrarEdad: true,
    mostrarUbicacionExacta: false,
    verificacionPerfil: 'pendiente',
  } satisfies PreferenciasPrivacidad,
  bloqueadosIds: [] as string[],
  idioma: 'es' as Idioma,
  tema: 'automatico' as Tema,
};
