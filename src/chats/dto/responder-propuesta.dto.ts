import { IsIn } from 'class-validator';

export class ResponderPropuestaDto {
  @IsIn(['aceptar', 'rechazar'])
  respuesta: 'aceptar' | 'rechazar';
}
