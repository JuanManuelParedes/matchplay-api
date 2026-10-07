import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Chat } from './entities/chat.entity';
import { Mensaje } from './entities/mensaje.entity';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { EventosService } from '../eventos/eventos.service';

@Injectable()
export class ChatsService {
  private readonly chats: Chat[] = [];

  constructor(private readonly eventosService: EventosService) {}

  /**
   * Un chat es siempre único entre dos usuarios. Se usa tanto para el
   * chat que nace de un match (pantalla HOME) como para el que nace de
   * unirse a un partido personal (pantalla Solicitudes) — ver nota en
   * ChatsModule sobre por qué esas dos llamadas automáticas no están
   * conectadas todavía en este corte del backend.
   */
  obtenerOCrearChat(usuarioIdA: string, usuarioIdB: string): Chat {
    const existente = this.chats.find(
      (c) =>
        (c.usuarioIdA === usuarioIdA && c.usuarioIdB === usuarioIdB) ||
        (c.usuarioIdA === usuarioIdB && c.usuarioIdB === usuarioIdA),
    );
    if (existente) return existente;

    const chat: Chat = {
      id: `chat_${uuid()}`,
      usuarioIdA,
      usuarioIdB,
      mensajes: [],
      creadoEn: new Date(),
    };
    this.chats.push(chat);
    return chat;
  }

  listarDeUsuario(usuarioId: string): Chat[] {
    return this.chats.filter(
      (c) => c.usuarioIdA === usuarioId || c.usuarioIdB === usuarioId,
    );
  }

  private obtenerChatPermitido(chatId: string, usuarioId: string): Chat {
    const chat = this.chats.find((c) => c.id === chatId);
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.usuarioIdA !== usuarioId && chat.usuarioIdB !== usuarioId) {
      throw new ForbiddenException('Este chat no te pertenece');
    }
    return chat;
  }

  listarMensajes(chatId: string, usuarioId: string): Mensaje[] {
    return this.obtenerChatPermitido(chatId, usuarioId).mensajes;
  }

  /**
   * POST /chats/{chatId}/mensajes. `tipo: propuesta_evento` es la forma
   * en que MatchPlay invita a alguien puntualmente a un evento ya
   * creado (ver decisión del modelo unificado de Eventos): no existe
   * un recurso `/invitaciones` separado.
   */
  enviarMensaje(
    chatId: string,
    usuarioId: string,
    datos: EnviarMensajeDto,
  ): Mensaje {
    const chat = this.obtenerChatPermitido(chatId, usuarioId);

    if (datos.tipo === 'texto' && !datos.texto) {
      throw new BadRequestException('texto es requerido cuando tipo es texto');
    }
    if (datos.tipo === 'propuesta_evento') {
      if (!datos.eventoId) {
        throw new BadRequestException(
          'eventoId es requerido cuando tipo es propuesta_evento',
        );
      }
      const evento = this.eventosService.obtenerUno(datos.eventoId);
      if (evento.creadorId !== usuarioId) {
        throw new ForbiddenException(
          'Solo puedes proponer un evento que tú mismo creaste',
        );
      }
    }

    const mensaje: Mensaje = {
      id: `msg_${uuid()}`,
      chatId,
      autorId: usuarioId,
      tipo: datos.tipo,
      texto: datos.texto,
      eventoId: datos.eventoId,
      estadoPropuesta: datos.tipo === 'propuesta_evento' ? 'pendiente' : undefined,
      fecha: new Date(),
    };
    chat.mensajes.push(mensaje);
    return mensaje;
  }

  /**
   * POST /chats/{chatId}/mensajes/{mensajeId}/responder. Si
   * respuesta === 'aceptar', dispara internamente el mismo
   * EventosService.unirse() que usa el botón "Unirme" de la pantalla
   * Eventos: la invitación por chat y el autoservicio terminan en el
   * mismo punto de entrada al dominio de Eventos.
   */
  responderPropuesta(
    chatId: string,
    mensajeId: string,
    usuarioId: string,
    respuesta: 'aceptar' | 'rechazar',
  ): Mensaje {
    const chat = this.obtenerChatPermitido(chatId, usuarioId);
    const mensaje = chat.mensajes.find((m) => m.id === mensajeId);
    if (!mensaje || mensaje.tipo !== 'propuesta_evento') {
      throw new NotFoundException('Propuesta de evento no encontrada');
    }
    if (mensaje.estadoPropuesta !== 'pendiente') {
      throw new ConflictException('Esta propuesta ya fue respondida');
    }

    if (respuesta === 'aceptar') {
      // Puede lanzar ConflictException/BadRequestException si el
      // evento ya no admite más participantes; se deja propagar tal
      // cual, como documenta el 409 de este endpoint en el spec.
      this.eventosService.unirse(mensaje.eventoId!, usuarioId);
      mensaje.estadoPropuesta = 'aceptada';
    } else {
      mensaje.estadoPropuesta = 'rechazada';
    }
    return mensaje;
  }
}
