import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PerfilesService } from './perfiles.service';

/** Tag "Perfiles" del spec. Todas las rutas requieren sesión. */
@ApiTags('Perfiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Tarjetas para swipe (pantalla HOME)' })
  feed(@CurrentUser() usuario: JwtPayload) {
    return this.perfilesService.feed(usuario.sub);
  }

  @Get(':perfilId')
  @ApiOperation({ summary: 'Ver el detalle de un perfil' })
  obtenerUno(@Param('perfilId') perfilId: string) {
    return this.perfilesService.obtenerUno(perfilId);
  }

  @Post(':perfilId/like')
  @ApiOperation({ summary: 'Dar like a un perfil (puede generar un match)' })
  like(
    @Param('perfilId') perfilId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.perfilesService.like(usuario.sub, perfilId);
  }

  @Post(':perfilId/pass')
  @ApiOperation({ summary: 'Descartar un perfil' })
  pass(
    @Param('perfilId') perfilId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.perfilesService.pass(usuario.sub, perfilId);
  }
}
