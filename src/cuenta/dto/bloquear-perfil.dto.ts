import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BloquearPerfilDto {
  @ApiProperty({ example: 'usr_001' })
  @IsString()
  perfilId: string;
}
