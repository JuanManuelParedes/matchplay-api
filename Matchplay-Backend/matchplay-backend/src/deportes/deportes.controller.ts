import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeportesService } from './deportes.service';

/**
 * Tag "Deportes" del spec. Ruta pública (security: [] en el YAML),
 * por eso no lleva JwtAuthGuard.
 */
@ApiTags('Deportes')
@Controller('deportes')
export class DeportesController {
  constructor(private readonly deportesService: DeportesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar deportes disponibles (pantalla Explorar)' })
  listar() {
    return this.deportesService.listar();
  }
}
