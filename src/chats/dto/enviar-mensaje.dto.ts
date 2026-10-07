import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, ValidateIf } from 'class-validator';
import { TipoMensaje } from '../entities/mensaje.entity';

/** Corresponde al schema MensajeRequest. */
export class EnviarMensajeDto {
  @ApiProperty({ enum: ['texto', 'propuesta_evento'] })
  @IsIn(['texto', 'propuesta_evento'])
  tipo: TipoMensaje;

  @ApiProperty({ required: false, description: 'Requerido si tipo es texto' })
  @ValidateIf((o) => o.tipo === 'texto')
  @IsString()
  texto?: string;

  @ApiProperty({
    required: false,
    description: 'Requerido si tipo es propuesta_evento',
    example: 'evt_001',
  })
  @ValidateIf((o) => o.tipo === 'propuesta_evento')
  @IsString()
  eventoId?: string;
}
