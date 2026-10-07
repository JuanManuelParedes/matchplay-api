import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ResponderPropuestaDto {
  @ApiProperty({ enum: ['aceptar', 'rechazar'] })
  @IsIn(['aceptar', 'rechazar'])
  respuesta: 'aceptar' | 'rechazar';
}
