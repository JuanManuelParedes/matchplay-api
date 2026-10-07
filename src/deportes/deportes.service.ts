import { Injectable } from '@nestjs/common';

export interface Deporte {
  id: string;
  nombre: string;
  iconoUrl?: string;
  disponibles: number;
}

/**
 * Catálogo fijo de deportes soportados por MatchPlay (ver pantalla
 * Explorar y el selector de "Deporte" en Crear evento). No requiere
 * persistencia porque no cambia por usuario.
 */
@Injectable()
export class DeportesService {
  private readonly deportes: Deporte[] = [
    { id: 'dep_futbol5', nombre: 'Fútbol 5', disponibles: 412 },
    { id: 'dep_basquet3x3', nombre: 'Básquet 3x3', disponibles: 198 },
    { id: 'dep_tenis', nombre: 'Tenis', disponibles: 87 },
    { id: 'dep_ciclismo', nombre: 'Ciclismo', disponibles: 64 },
    { id: 'dep_padel', nombre: 'Pádel', disponibles: 73 },
    { id: 'dep_voleibol', nombre: 'Vóleibol', disponibles: 121 },
  ];

  listar(): Deporte[] {
    return this.deportes;
  }
}
