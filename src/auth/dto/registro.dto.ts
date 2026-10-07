import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  Equals,
  IsArray,
  IsEmail,
  IsInt,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Datos combinados de los 2 pasos de registro (ver pantallas
 * "Crea tu cuenta" y "Cuéntanos de ti" del prototipo web).
 */
export class RegistroDto {
  @ApiProperty({ example: 'carlos_torres' })
  @IsString()
  nombreUsuario: string;

  @ApiProperty({ example: 'miemail@ejemplo.com' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'contrasena123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 23 })
  @IsInt()
  @Min(13)
  edad: number;

  @ApiProperty({ example: ['Fútbol 5', 'Vóleibol', 'Running'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  deportesFavoritos: string[];

  @ApiProperty({ example: true })
  @Equals(true, { message: 'Debes aceptar los términos y condiciones' })
  aceptaTerminos: boolean;
}
