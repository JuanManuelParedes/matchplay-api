import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { DiaSemana, FranjaHoraria } from '../../auth/entities/usuario.entity';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export class HorarioDisponibleDto {
  @ApiProperty({ example: ['Martes', 'Jueves', 'Sábado'] })
  @IsArray()
  @IsIn(DIAS, { each: true })
  dias: DiaSemana[];

  @ApiProperty({ enum: ['Mañana', 'Tarde', 'Noche'], required: false })
  @IsOptional()
  @IsIn(['Mañana', 'Tarde', 'Noche'])
  franjaHoraria?: FranjaHoraria;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notas?: string;
}
