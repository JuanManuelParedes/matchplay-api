import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsString, Min } from 'class-validator';
import { NivelJuego } from '../../auth/entities/usuario.entity';

export class PreferenciasDeportivasDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  deportesFavoritos: string[];

  @IsIn(['Principiante', 'Intermedio', 'Avanzado'])
  nivel: NivelJuego;

  @IsInt()
  @Min(1)
  radioBusquedaKm: number;
}