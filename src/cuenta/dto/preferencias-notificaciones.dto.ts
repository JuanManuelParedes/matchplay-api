import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean } from 'class-validator';

/**
 * Agrupado en 3 categorías en la UI (Actividad de partidos, Eventos,
 * General), aplanado aquí.
 */
export class PreferenciasNotificacionesBaseDto {
  @IsBoolean() nuevasSolicitudes: boolean;
  @IsBoolean() mensajesNuevos: boolean;
  @IsBoolean() recordatorioPartido: boolean;
  @IsBoolean() nuevosEventosCerca: boolean;
  @IsBoolean() cuposCasiLlenos: boolean;
  @IsBoolean() cambiosEnEventos: boolean;
  @IsBoolean() novedadesYPromociones: boolean;
}

/** PATCH: el usuario solo manda los toggles que cambió. */
export class ActualizarNotificacionesDto extends PartialType(
  PreferenciasNotificacionesBaseDto,
) {}