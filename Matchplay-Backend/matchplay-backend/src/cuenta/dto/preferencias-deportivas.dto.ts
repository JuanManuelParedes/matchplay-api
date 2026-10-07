import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsString, Min } from 'class-validator';
import { NivelJuego } from '../../auth/entities/usuario.entity';

export class PreferenciasDeportivasDto {
  @ApiProperty({ example: ['Fútbol 5', 'Básquet 3x3', 'Tenis'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  deportesFavoritos: string[];

  @ApiProperty({ enum: ['Principiante', 'Intermedio', 'Avanzado'] })
  @IsIn(['Principiante', 'Intermedio', 'Avanzado'])
  nivel: NivelJuego;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  radioBusquedaKm: number;
}
