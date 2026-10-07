import { PartialType } from '@nestjs/swagger';
import { CrearEventoDto } from './crear-evento.dto';

/** PATCH /eventos/{eventoId}: todos los campos son opcionales. */
export class ActualizarEventoDto extends PartialType(CrearEventoDto) {}
