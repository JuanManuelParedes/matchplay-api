import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PreferenciasPrivacidadBaseDto {
  @ApiProperty() @IsBoolean() perfilVisibleEnBusqueda: boolean;
  @ApiProperty() @IsBoolean() mostrarEdad: boolean;
  @ApiProperty() @IsBoolean() mostrarUbicacionExacta: boolean;
  // verificacionPerfil no se edita manualmente: la cambia un proceso de
  // verificación aparte, por eso no está en este DTO de entrada.
}

/** PATCH: el usuario solo manda los toggles que cambió. */
export class ActualizarPrivacidadDto extends PartialType(
  PreferenciasPrivacidadBaseDto,
) {}
