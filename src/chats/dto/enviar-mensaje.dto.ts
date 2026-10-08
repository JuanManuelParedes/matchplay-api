import { IsIn, IsString, ValidateIf } from 'class-validator';
import { TipoMensaje } from '../entities/mensaje.entity';

export class EnviarMensajeDto {
  @IsIn(['texto', 'propuesta_evento'])
  tipo: TipoMensaje;

  /** Requerido si tipo es texto. */
  @ValidateIf((o) => o.tipo === 'texto')
  @IsString()
  texto?: string;

  /** Requerido si tipo es propuesta_evento. */
  @ValidateIf((o) => o.tipo === 'propuesta_evento')
  @IsString()
  eventoId?: string;
}