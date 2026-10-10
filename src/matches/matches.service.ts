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
  /** Perfiles descartados con "pass". Misma clave: `${deQuien}->${aQuien}` */
  private readonly descartados = new Set<string>();

  /**
   * Registra que `deUsuarioId` dio like a `aUsuarioId`.
   * Devuelve el Match si se formó uno (porque `aUsuarioId` ya había
   * dado like antes a `deUsuarioId`), o undefined si no.
   */
  registrarLike(deUsuarioId: string, aUsuarioId: string): Match | undefined {
    this.likesDados.add(`${deUsuarioId}->${aUsuarioId}`);
    // Si antes lo había descartado, el like posterior anula el descarte.
    this.descartados.delete(`${deUsuarioId}->${aUsuarioId}`);

    // Si ya existe un match entre ambos, se devuelve ese mismo (sin duplicar).
    const existente = this.matches.find(
      (m) =>
        (m.usuarioIdA === deUsuarioId && m.usuarioIdB === aUsuarioId) ||
        (m.usuarioIdA === aUsuarioId && m.usuarioIdB === deUsuarioId),
    );
    if (existente) return existente;

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

  /** Guarda que `deUsuarioId` descartó a `aUsuarioId` (para sacarlo del feed). */
  registrarPass(deUsuarioId: string, aUsuarioId: string): void {
    this.descartados.add(`${deUsuarioId}->${aUsuarioId}`);
  }

  /** ¿`deUsuarioId` ya descartó a `aUsuarioId`? */
  fueDescartado(deUsuarioId: string, aUsuarioId: string): boolean {
    return this.descartados.has(`${deUsuarioId}->${aUsuarioId}`);
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
    // Se borran también los likes de ambos lados; si no, el siguiente like
    // de cualquiera de los dos recrearía el match al instante.
    this.likesDados.delete(`${match.usuarioIdA}->${match.usuarioIdB}`);
    this.likesDados.delete(`${match.usuarioIdB}->${match.usuarioIdA}`);
  }
}
