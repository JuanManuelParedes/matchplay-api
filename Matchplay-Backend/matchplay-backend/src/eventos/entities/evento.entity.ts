export type TipoEvento = 'personal' | 'comunidad';
export type EstadoEvento = 'borrador' | 'publicado' | 'cancelado' | 'finalizado';
export type NivelRequerido = 'Cualquiera' | 'Principiante' | 'Intermedio' | 'Avanzado';

/**
 * Modelo unificado de evento (ver matchplay-api-unificada.yaml):
 * `tipo: personal` alimenta la pestaña "Solicitudes" y `tipo: comunidad`
 * la pestaña "Eventos", pero ambos comparten el mismo ciclo de vida y el
 * mismo mecanismo de unión por autoservicio (join/unjoin).
 */
export interface Evento {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  deporte: string;
  fechaHora: Date;
  lugar: string;
  cupoMaximo: number;
  nivelRequerido: NivelRequerido;
  descripcion?: string;
  fotoUrl?: string;
  estado: EstadoEvento;
  creadorId: string;
  /** Incluye siempre al creador. */
  participantesIds: string[];
  calificacionPromedio?: number | null;
  creadoEn: Date;
}
