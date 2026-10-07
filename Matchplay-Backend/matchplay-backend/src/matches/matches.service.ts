import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Match } from './entities/match.entity';

/**
 * Repositorio en memoria de matches + registro de likes dados, para
 * detectar el like mutuo que dispara un match (pantalla HOME → swipe).
 * Lo usa PerfilesService; se expone también vía /matches (tag Matches).
 */
@Injectable()
export class MatchesService {
  private readonly matches: Match[] = [];
  /** Clave: `${deQuien}->${aQuien}` */
  private readonly likesDados = new Set<string>();

  /**
   * Registra que `deUsuarioId` dio like a `aUsuarioId`.
   * Devuelve el Match si se formó uno (porque `aUsuarioId` ya había
   * dado like antes a `deUsuarioId`), o undefined si no.
   */
  registrarLike(deUsuarioId: string, aUsuarioId: string): Match | undefined {
    this.likesDados.add(`${deUsuarioId}->${aUsuarioId}`);

    const huboLikeReciproco = this.likesDados.has(
      `${aUsuarioId}->${deUsuarioId}`,
    );
    if (!huboLikeReciproco) return undefined;

    const match: Match = {
      id: `match_${uuid()}`,
      usuarioIdA: deUsuarioId,
      usuarioIdB: aUsuarioId,
      creadoEn: new Date(),
    };
    this.matches.push(match);
    return match;
  }

  listarDeUsuario(usuarioId: string): Match[] {
    return this.matches.filter(
      (m) => m.usuarioIdA === usuarioId || m.usuarioIdB === usuarioId,
    );
  }

  /** El id del otro perfil dentro de un match, visto desde `usuarioId`. */
  otroParticipante(match: Match, usuarioId: string): string {
    return match.usuarioIdA === usuarioId ? match.usuarioIdB : match.usuarioIdA;
  }

  eliminar(matchId: string, usuarioId: string): void {
    const match = this.matches.find((m) => m.id === matchId);
    if (!match) {
      throw new NotFoundException('Match no encontrado');
    }
    if (match.usuarioIdA !== usuarioId && match.usuarioIdB !== usuarioId) {
      throw new ForbiddenException('Este match no te pertenece');
    }
    const index = this.matches.indexOf(match);
    this.matches.splice(index, 1);
  }
}
