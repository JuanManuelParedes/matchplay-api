import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Usuario } from './entities/usuario.entity';

/**
 * Repositorio en memoria de usuarios, compartido entre AuthModule y
 * PerfilesModule. Reemplazar por un repositorio real (TypeORM/Prisma)
 * sin tocar los controladores: solo este archivo cambia.
 */
@Injectable()
export class UsersService {
  private readonly usuarios: Usuario[] = [];

  crear(datos: Omit<Usuario, 'id' | 'creadoEn'>): Usuario {
    const usuario: Usuario = {
      ...datos,
      id: `usr_${uuid()}`,
      creadoEn: new Date(),
    };
    this.usuarios.push(usuario);
    return usuario;
  }

  buscarPorCorreo(correo: string): Usuario | undefined {
    return this.usuarios.find((u) => u.correo === correo);
  }

  buscarPorId(id: string): Usuario | undefined {
    return this.usuarios.find((u) => u.id === id);
  }

  listar(excluirId?: string): Usuario[] {
    return this.usuarios.filter((u) => u.id !== excluirId);
  }

  actualizar(id: string, cambios: Partial<Usuario>): Usuario | undefined {
    const usuario = this.buscarPorId(id);
    if (!usuario) return undefined;
    Object.assign(usuario, cambios);
    return usuario;
  }

  eliminar(id: string): void {
    const index = this.usuarios.findIndex((u) => u.id === id);
    if (index !== -1) this.usuarios.splice(index, 1);
  }
}
