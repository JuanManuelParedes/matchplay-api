import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { DiaSemana, FranjaHoraria } from '../../auth/entities/usuario.entity';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export class HorarioDisponibleDto {
  @IsArray()
  @IsIn(DIAS, { each: true })
  dias: DiaSemana[];

  @IsOptional()
  @IsIn(['Mañana', 'Tarde', 'Noche'])
  franjaHoraria?: FranjaHoraria;

  @IsOptional()
  @IsString()
  notas?: string;
}