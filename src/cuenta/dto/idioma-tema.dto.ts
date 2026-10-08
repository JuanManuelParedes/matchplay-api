import { IsIn } from 'class-validator';
import { Idioma, Tema } from '../../auth/entities/usuario.entity';

export class ActualizarIdiomaDto {
  @IsIn(['es', 'en', 'pt'])
  idioma: Idioma;
}

export class ActualizarTemaDto {
  @IsIn(['oscuro', 'claro', 'automatico'])
  tema: Tema;
}