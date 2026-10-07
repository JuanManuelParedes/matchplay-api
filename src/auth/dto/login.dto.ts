import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'miemail@ejemplo.com' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'contrasena123' })
  @IsString()
  @MinLength(8)
  password: string;
}
