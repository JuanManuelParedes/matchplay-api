import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Evento } from './entities/evento.entity';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';

/** Foto genérica por deporte: el usuario nunca sube una foto propia del evento. */
const FOTOS_POR_DEPORTE: Record<string, string> = {
  'Fútbol 5': '/fotos-eventos/futbol.jpg',
  'Básquet 3x3': '/fotos-eventos/basquet.jpg',
  Tenis: '/fotos-eventos/tenis.jpg',
  Ciclismo: '/fotos-eventos/ciclismo.jpg',
  Pádel: '/fotos-eventos/padel.jpg',
  Vóleibol: '/fotos-eventos/voleibol.jpg',
};

@Injectable()
export class EventosService {
  private readonly eventos: Evento[] = [];

  /**
   * POST /eventos. Se crea en estado `borrador`: el botón "Publicar
   * evento" de la pantalla Crear Evento hace crear() y luego publicar()
   * en la misma interacción del usuario, pero quedan como dos pasos de
   * API independientes para soportar guardar un borrador sin publicarlo.
   */
  crear(creadorId: string, datos: CrearEventoDto): Evento {
    const evento: Evento = {
      id: `evt_${uuid()}`,
      tipo: datos.tipo,
      titulo: datos.titulo,
      deporte: datos.deporte,
      fechaHora: new Date(datos.fechaHora),
      lugar: datos.lugar,
      cupoMaximo: datos.cupoMaximo,
      nivelRequerido: datos.nivelRequerido ?? 'Cualquiera',
      descripcion: datos.descripcion,
      fotoUrl: FOTOS_POR_DEPORTE[datos.deporte],
      estado: 'borrador',
      creadorId,
      participantesIds: [creadorId],
      calificacionPromedio: null,
      creadoEn: new Date(),
    };
    this.eventos.push(evento);
    return evento;
  }

  /** GET /eventos: solo lo público y publicado (pestañas Solicitudes/Eventos). */
  listarPublicados(tipo?: 'personal' | 'comunidad', deporte?: string): Evento[] {
    return this.eventos.filter(
      (e) =>
        e.estado === 'publicado' &&
        (!tipo || e.tipo === tipo) &&
        (!deporte || e.deporte === deporte),
    );
  }

  /** GET /eventos/mios: todo lo que el usuario creó, en cualquier estado. */
  listarMios(usuarioId: string): Evento[] {
    return this.eventos.filter((e) => e.creadorId === usuarioId);
  }

  obtenerUno(eventoId: string): Evento {
    const evento = this.eventos.find((e) => e.id === eventoId);
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    return evento;
  }

  actualizar(
    eventoId: string,
    usuarioId: string,
    cambios: ActualizarEventoDto,
  ): Evento {
    const evento = this.obtenerUno(eventoId);
    this.asegurarQueEsCreador(evento, usuarioId);

    Object.assign(evento, {
      ...cambios,
      fechaHora: cambios.fechaHora ? new Date(cambios.fechaHora) : evento.fechaHora,
    });
    if (cambios.deporte) {
      evento.fotoUrl = FOTOS_POR_DEPORTE[cambios.deporte] ?? evento.fotoUrl;
    }
    return evento;
  }

  publicar(eventoId: string, usuarioId: string): Evento {
    const evento = this.obtenerUno(eventoId);
    this.asegurarQueEsCreador(evento, usuarioId);

    if (evento.estado !== 'borrador') {
      throw new ConflictException('Solo un evento en borrador puede publicarse');
    }
    evento.estado = 'publicado';
    return evento;
  }

  cancelar(eventoId: string, usuarioId: string): Evento {
    const evento = this.obtenerUno(eventoId);
    this.asegurarQueEsCreador(evento, usuarioId);

    if (evento.estado === 'cancelado' || evento.estado === 'finalizado') {
      throw new ConflictException('El evento ya terminó su ciclo de vida');
    }
    evento.estado = 'cancelado';
    return evento;
  }

  /** POST /eventos/{id}/join: autoservicio, sin invitación previa. */
  unirse(eventoId: string, usuarioId: string): Evento {
    const evento = this.obtenerUno(eventoId);

    if (evento.estado !== 'publicado') {
      throw new ConflictException('Solo puedes unirte a un evento publicado');
    }
    if (evento.participantesIds.includes(usuarioId)) {
      throw new ConflictException('Ya estás en este evento');
    }
    if (evento.participantesIds.length >= evento.cupoMaximo) {
      throw new BadRequestException('El evento ya alcanzó su cupo máximo');
    }
    evento.participantesIds.push(usuarioId);
    return evento;
  }

  /** DELETE /eventos/{id}/join: el creador no puede abandonar su propio evento. */
  salir(eventoId: string, usuarioId: string): Evento {
    const evento = this.obtenerUno(eventoId);

    if (evento.creadorId === usuarioId) {
      throw new ForbiddenException(
        'El creador no puede salir de su propio evento; usa cancelar',
      );
    }
    evento.participantesIds = evento.participantesIds.filter(
      (id) => id !== usuarioId,
    );
    return evento;
  }

  participantesIds(eventoId: string): string[] {
    return this.obtenerUno(eventoId).participantesIds;
  }

  cuposOcupados(evento: Evento): number {
    return evento.participantesIds.length;
  }

  private asegurarQueEsCreador(evento: Evento, usuarioId: string) {
    if (evento.creadorId !== usuarioId) {
      throw new ForbiddenException('Solo el creador del evento puede hacer esto');
    }
  }
}
