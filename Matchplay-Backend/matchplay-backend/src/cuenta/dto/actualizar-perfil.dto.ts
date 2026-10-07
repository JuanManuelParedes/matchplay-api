import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

/** Corresponde al schema PerfilPropioUpdate: todos los campos opcionales. */
export class ActualizarPerfilDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombreUsuario?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  edad?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sobreMi?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  fotoUrl?: string;
}
