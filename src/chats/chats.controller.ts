import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ChatsService } from './chats.service';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { ResponderPropuestaDto } from './dto/responder-propuesta.dto';
import { UsersService } from '../auth/users.service';
import { Chat } from './entities/chat.entity';

/** Todas las rutas requieren sesión. */
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  listar(
    @CurrentUser() usuario: JwtPayload,
    @Query('deporte') deporte?: string,
  ) {
    return this.chatsService
      .listarDeUsuario(usuario.sub)
      .map((chat) => this.aResumen(chat, usuario.sub))
      .filter((resumen) => !deporte || resumen.perfil?.deporte === deporte);
  }

  @Get(':chatId/mensajes')
  listarMensajes(
    @Param('chatId') chatId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.chatsService.listarMensajes(chatId, usuario.sub);
  }

  @Post(':chatId/mensajes')
  enviarMensaje(
    @Param('chatId') chatId: string,
    @Body() datos: EnviarMensajeDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.chatsService.enviarMensaje(chatId, usuario.sub, datos);
  }

  @Post(':chatId/mensajes/:mensajeId/responder')
  responder(
    @Param('chatId') chatId: string,
    @Param('mensajeId') mensajeId: string,
    @Body() datos: ResponderPropuestaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.chatsService.responderPropuesta(
      chatId,
      mensajeId,
      usuario.sub,
      datos.respuesta,
    );
  }

  /** Convierte el chat interno en el resumen que se devuelve al cliente. */
  private aResumen(chat: Chat, usuarioActualId: string) {
    const otroId =
      chat.usuarioIdA === usuarioActualId ? chat.usuarioIdB : chat.usuarioIdA;
    const otro = this.usersService.buscarPorId(otroId);
    const ultimo = chat.mensajes[chat.mensajes.length - 1];

    return {
      id: chat.id,
      perfil: otro
        ? {
            id: otro.id,
            nombre: otro.nombreUsuario,
            edad: otro.edad,
            fotoUrl: otro.fotoUrl,
            deporte: otro.deportesFavoritos[0],
            nivel: otro.nivel,
          }
        : null,
      ultimoMensaje: ultimo?.texto,
      ultimoMensajeFecha: ultimo?.fecha,
      noLeidos: 0,
      // TODO: estado de conexión real; requiere trackear sockets/último
      // heartbeat del usuario, fuera del alcance de este corte.
      enLinea: false,
    };
  }
}
