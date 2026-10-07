import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../auth/users.service';
import { MatchesService } from '../matches/matches.service';
import { ChatsService } from '../chats/chats.service';
import { Usuario } from '../auth/entities/usuario.entity';

/** Forma pública de un perfil (tarjeta de swipe), nunca incluye datos privados. */
function aPerfilPublico(usuario: Usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombreUsuario,
    edad: usuario.edad,
    fotoUrl: usuario.fotoUrl,
    deporte: usuario.deportesFavoritos[0],
    nivel: usuario.nivel,
  };
}

@Injectable()
export class PerfilesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly matchesService: MatchesService,
    private readonly chatsService: ChatsService,
  ) {}

  /** Corresponde a GET /perfiles/feed (pantalla HOME de swipe). */
  feed(usuarioActualId: string) {
    return this.usersService
      .listar(usuarioActualId)
      .map((usuario) => aPerfilPublico(usuario));
  }

  obtenerUno(perfilId: string) {
    const usuario = this.usersService.buscarPorId(perfilId);
    if (!usuario) {
      throw new NotFoundException('Perfil no encontrado');
    }
    return aPerfilPublico(usuario);
  }

  /**
   * Corresponde a POST /perfiles/{perfilId}/like. Si el otro usuario ya
   * había dado like antes, se forma un match y, con él, el chat entre
   * ambos (así la pantalla de Chats ya tiene con quién hablar apenas
   * ocurre el match, sin un paso adicional).
   */
  like(usuarioActualId: string, perfilId: string) {
    this.asegurarQueExiste(perfilId);
    const match = this.matchesService.registrarLike(usuarioActualId, perfilId);
    if (match) {
      this.chatsService.obtenerOCrearChat(usuarioActualId, perfilId);
    }
    return { match: Boolean(match), matchId: match?.id };
  }

  pass(usuarioActualId: string, perfilId: string) {
    this.asegurarQueExiste(perfilId);
    // No hay estado que guardar más allá de quitarlo del feed del
    // cliente; se deja el método explícito porque el spec lo define
    // como su propio endpoint (POST /perfiles/{perfilId}/pass).
    return { mensaje: 'Perfil descartado' };
  }

  private asegurarQueExiste(perfilId: string) {
    const usuario = this.usersService.buscarPorId(perfilId);
    if (!usuario) {
      throw new NotFoundException('Perfil no encontrado');
    }
  }
}
