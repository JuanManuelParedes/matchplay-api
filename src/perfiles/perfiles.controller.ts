import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PerfilesService } from './perfiles.service';

/** Todas las rutas requieren sesión. */
@UseGuards(JwtAuthGuard)
@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Get('feed')
  feed(@CurrentUser() usuario: JwtPayload) {
    return this.perfilesService.feed(usuario.sub);
  }

  @Get(':perfilId')
  obtenerUno(@Param('perfilId') perfilId: string) {
    return this.perfilesService.obtenerUno(perfilId);
  }

  @Post(':perfilId/like')
  like(
    @Param('perfilId') perfilId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.perfilesService.like(usuario.sub, perfilId);
  }

  @Post(':perfilId/pass')
  pass(
    @Param('perfilId') perfilId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.perfilesService.pass(usuario.sub, perfilId);
  }
}
