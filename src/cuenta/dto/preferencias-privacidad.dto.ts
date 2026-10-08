import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean } from 'class-validator';

export class PreferenciasPrivacidadBaseDto {
  @IsBoolean() perfilVisibleEnBusqueda: boolean;
  @IsBoolean() mostrarEdad: boolean;
  @IsBoolean() mostrarUbicacionExacta: boolean;
  // verificacionPerfil no se edita manualmente: la cambia un proceso de
  // verificación aparte, por eso no está en este DTO de entrada.
}

/** PATCH: el usuario solo manda los toggles que cambió. */
export class ActualizarPrivacidadDto extends PartialType(
  PreferenciasPrivacidadBaseDto,
) {}