import { Controller, Get } from '@nestjs/common';
import { DeportesService } from './deportes.service';

/**Ruta pública,
 * por eso no lleva JwtAuthGuard.
 */
@Controller('deportes')
export class DeportesController {
  constructor(private readonly deportesService: DeportesService) {}

  @Get()
  listar() {
    return this.deportesService.listar();
  }
}