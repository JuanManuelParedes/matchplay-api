import { IsString } from 'class-validator';

export class BloquearPerfilDto {
  @IsString()
  perfilId: string;
}