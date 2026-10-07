import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { PREFERENCIAS_POR_DEFECTO, Usuario } from './entities/usuario.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(datos: RegistroDto) {
    const existente = this.usersService.buscarPorCorreo(datos.correo);
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const passwordHash = await bcrypt.hash(datos.password, SALT_ROUNDS);

    const usuario = this.usersService.crear({
      nombreUsuario: datos.nombreUsuario,
      correo: datos.correo,
      passwordHash,
      edad: datos.edad,
      deportesFavoritos: datos.deportesFavoritos,
      nivel: 'Principiante',
      estadisticas: {
        partidosJugados: 0,
        calificacion: 0,
        eventosOrganizados: 0,
      },
      ...PREFERENCIAS_POR_DEFECTO,
    });

    return this.firmarToken(usuario);
  }

  async login(datos: LoginDto) {
    const usuario = this.usersService.buscarPorCorreo(datos.correo);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(
      datos.password,
      usuario.passwordHash,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.firmarToken(usuario);
  }

  /**
   * Corresponde a POST /auth/logout. Como usamos JWT sin estado, no hay
   * nada que invalidar en el servidor; el cliente simplemente descarta
   * el token. Se deja el método para que el controlador tenga una ruta
   * explícita, útil si luego se agrega una lista negra de tokens o
   * refresh tokens con estado.
   */
  logout() {
    return { mensaje: 'Sesión cerrada' };
  }

  recuperarPassword(correo: string) {
    const usuario = this.usersService.buscarPorCorreo(correo);
    // Siempre respondemos igual exista o no el correo, para no filtrar
    // qué correos están registrados.
    if (usuario) {
      // TODO: generar token de un solo uso y enviarlo por correo (p.ej. con un
      // proveedor como SendGrid/SES). Por ahora solo se documenta el contrato.
    }
    return { mensaje: 'Si el correo existe, se envió un enlace de recuperación' };
  }

  async restablecerPassword(_token: string, passwordNueva: string) {
    // TODO: validar el token de un solo uso emitido en recuperarPassword().
    const passwordHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
    return { passwordHash, mensaje: 'Contraseña actualizada' };
  }

  private firmarToken(usuario: Usuario) {
    const payload = { sub: usuario.id, nombreUsuario: usuario.nombreUsuario };
    return {
      token: this.jwtService.sign(payload),
      usuario: this.aPerfilPropio(usuario),
    };
  }

  /** Nunca se devuelve passwordHash al cliente. */
  private aPerfilPropio(usuario: Usuario) {
    const { passwordHash, ...resto } = usuario;
    return resto;
  }
}
