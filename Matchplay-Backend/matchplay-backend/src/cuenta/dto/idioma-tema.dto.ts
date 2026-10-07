import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { Idioma, Tema } from '../../auth/entities/usuario.entity';

export class ActualizarIdiomaDto {
  @ApiProperty({ enum: ['es', 'en', 'pt'] })
  @IsIn(['es', 'en', 'pt'])
  idioma: Idioma;
}

export class ActualizarTemaDto {
  @ApiProperty({ enum: ['oscuro', 'claro', 'automatico'] })
  @IsIn(['oscuro', 'claro', 'automatico'])
  tema: Tema;
}
