import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class PreferenciasPrivacidadBaseDto {
  @IsBoolean() perfilVisibleEnBusqueda: boolean;
  @IsBoolean() mostrarEdad: boolean;
  @IsBoolean() mostrarUbicacionExacta: boolean;
}

/** PATCH: el usuario solo manda los toggles que cambió. */
export class ActualizarPrivacidadDto extends PartialType(
  PreferenciasPrivacidadBaseDto,
) {
  /**
   * El contrato (Insomnia) lo envía en el body, así que se acepta para que
   * la validación no rechace la petición. Pero NO se guarda: la
   * verificación la cambia un proceso aparte, no el propio usuario.
   */
  @IsOptional()
  @IsIn(['pendiente', 'verificado'])
  verificacionPerfil?: 'pendiente' | 'verificado';
}