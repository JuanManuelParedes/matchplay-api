import { IsEmail, IsString, MinLength } from 'class-validator';

export class RecuperarPasswordDto {
  @IsEmail()
  correo: string;

  @IsString()
  nombreUsuario: string;
}

export class RestablecerPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  nuevaPassword: string;
}
