import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventosModule } from '../eventos/eventos.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

/**
 * Depende de EventosModule (una sola dirección: Chats -> Eventos) porque
 * aceptar una propuesta de evento llama a EventosService.unirse().
 *
 * NOTA de diseño: el spec también dice que se crea un chat automático al
 * unirse a un partido personal (no solo al hacer match). Eso ya pasa
 * cuando la invitación llega por chat (propuesta_evento, porque el chat
 * ya existe), pero NO cuando alguien se une por autoservicio directo
 * desde la pantalla Eventos sin haber chateado antes: conectar ese caso
 * exigiría que EventosModule importe ChatsModule, creando el ciclo
 * Eventos <-> Chats. Queda pendiente para resolverse con un
 * EventEmitterModule de Nest (Eventos emite "evento.participante_unido",
 * Chats escucha) en vez de un forwardRef() circular.
 */
@Module({
  imports: [AuthModule, EventosModule],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
