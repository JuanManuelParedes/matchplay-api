import { Controller, Delete, Get, HttpCode, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { MatchesService } from './matches.service';
import { UsersService } from '../auth/users.service';

/** GET /matches, DELETE /matches/{matchId}. */
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  listar(@CurrentUser() usuario: JwtPayload) {
    return this.matchesService.listarDeUsuario(usuario.sub).map((match) => {
      const otroId = this.matchesService.otroParticipante(match, usuario.sub);
      const otro = this.usersService.buscarPorId(otroId);
      return {
        id: match.id,
        perfil: otro
          ? {
              id: otro.id,
              nombre: otro.nombreUsuario,
              edad: otro.edad,
              fotoUrl: otro.fotoUrl,
              nivel: otro.nivel,
            }
          : null,
        creadoEn: match.creadoEn,
      };
    });
  }

  @Delete(':matchId')
  @HttpCode(204)
  eliminar(
    @Param('matchId') matchId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    this.matchesService.eliminar(matchId, usuario.sub);
  }
}
