import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { NivelRequerido, TipoEvento } from '../entities/evento.entity';

/** Corresponde al schema EventoRequest. */
export class CrearEventoDto {
  @ApiProperty({
    enum: ['personal', 'comunidad'],
    description: 'personal → pestaña Solicitudes; comunidad → pestaña Eventos',
  })
  @IsIn(['personal', 'comunidad'])
  tipo: TipoEvento;

  @ApiProperty({ example: 'Pichanga de fútbol 5' })
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Fútbol 5' })
  @IsString()
  deporte: string;

  @ApiProperty({ example: '2026-08-09T19:00:00-05:00' })
  @IsDateString()
  fechaHora: string;

  @ApiProperty({ example: 'Coliseo Municipal' })
  @IsString()
  lugar: string;

  @ApiProperty({ example: 10, minimum: 2 })
  @IsInt()
  @Min(2)
  cupoMaximo: number;

  @ApiProperty({
    enum: ['Cualquiera', 'Principiante', 'Intermedio', 'Avanzado'],
    default: 'Cualquiera',
    required: false,
  })
  @IsOptional()
  @IsIn(['Cualquiera', 'Principiante', 'Intermedio', 'Avanzado'])
  nivelRequerido?: NivelRequerido;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
