import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { NivelRequerido, TipoEvento } from '../entities/evento.entity';

export class CrearEventoDto {
  /** personal → pestaña Solicitudes; comunidad → pestaña Eventos. */
  @IsIn(['personal', 'comunidad'])
  tipo: TipoEvento;

  @IsString()
  titulo: string;

  @IsString()
  deporte: string;

  @IsDateString()
  fechaHora: string;

  @IsString()
  lugar: string;

  @IsInt()
  @Min(2)
  cupoMaximo: number;

  @IsOptional()
  @IsIn(['Cualquiera', 'Principiante', 'Intermedio', 'Avanzado'])
  nivelRequerido?: NivelRequerido;

  @IsOptional()
  @IsString()
  descripcion?: string;
}