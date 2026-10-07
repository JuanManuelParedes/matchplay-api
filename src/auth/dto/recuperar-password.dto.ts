import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RecuperarPasswordDto {
  @ApiProperty({ example: 'miemail@ejemplo.com' })
  @IsEmail()
  correo: string;
}

export class RestablecerPasswordDto {
  @ApiProperty({ description: 'Token recibido por correo' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'nuevaContrasena123', minLength: 8 })
  @IsString()
  @MinLength(8)
  passwordNueva: string;
}
