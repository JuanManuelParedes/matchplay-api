import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Agrupado en 3 categorías en la UI (Actividad de partidos, Eventos,
 * General), aplanado aquí igual que en el schema del spec.
 */
export class PreferenciasNotificacionesBaseDto {
  @ApiProperty() @IsBoolean() nuevasSolicitudes: boolean;
  @ApiProperty() @IsBoolean() mensajesNuevos: boolean;
  @ApiProperty() @IsBoolean() recordatorioPartido: boolean;
  @ApiProperty() @IsBoolean() nuevosEventosCerca: boolean;
  @ApiProperty() @IsBoolean() cuposCasiLlenos: boolean;
  @ApiProperty() @IsBoolean() cambiosEnEventos: boolean;
  @ApiProperty() @IsBoolean() novedadesYPromociones: boolean;
}

/** PATCH: el usuario solo manda los toggles que cambió. */
export class ActualizarNotificacionesDto extends PartialType(
  PreferenciasNotificacionesBaseDto,
) {}
