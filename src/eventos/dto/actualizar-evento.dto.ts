import { PartialType } from '@nestjs/mapped-types';
import { CrearEventoDto } from './crear-evento.dto';

/** PATCH /eventos/{eventoId}: todos los campos son opcionales. */
export class ActualizarEventoDto extends PartialType(CrearEventoDto) {}
