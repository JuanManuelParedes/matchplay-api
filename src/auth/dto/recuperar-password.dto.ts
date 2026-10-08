import { IsEmail, IsString, MinLength } from 'class-validator';

export class RecuperarPasswordDto {
  @IsEmail()
  correo: string;
}

export class RestablecerPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  passwordNueva: string;
}
