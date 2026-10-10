import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { crearPreferenciasPorDefecto, Usuario } from './entities/usuario.entity';

const SALT_ROUNDS = 10;
/** Vigencia del token de recuperación: 1 hora. */
const TOKEN_RECUPERACION_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Tokens de un solo uso: token -> usuario y fecha de expiración (en memoria). */
  private readonly tokensRecuperacion = new Map<
    string,
    { usuarioId: string; expira: number }
  >();

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
      ...crearPreferenciasPorDefecto(),
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

  /**
   * POST /auth/recuperar-password. Solo genera token si el correo Y el
   * nombre de usuario corresponden a la misma cuenta. La respuesta es
   * siempre la misma para no revelar qué cuentas existen.
   *
   * Aún no hay proveedor de correo: en desarrollo (NODE_ENV distinto de
   * "production") el token se devuelve en la respuesta y se imprime en
   * consola para poder probar el flujo completo.
   */
  recuperarPassword(correo: string, nombreUsuario: string) {
    const respuesta: { mensaje: string; token?: string } = {
      mensaje: 'Si los datos coinciden, se envió un enlace de recuperación',
    };

    const usuario = this.usersService.buscarPorCorreo(correo);
    if (usuario && usuario.nombreUsuario === nombreUsuario) {
      const token = uuid();
      this.tokensRecuperacion.set(token, {
        usuarioId: usuario.id,
        expira: Date.now() + TOKEN_RECUPERACION_MS,
      });
      // TODO: enviar el token por correo (SendGrid/SES) en vez de devolverlo.
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`Token de recuperación para ${correo}: ${token}`);
        respuesta.token = token;
      }
    }
    return respuesta;
  }

  /** POST /auth/restablecer-password. El token es de un solo uso. */
  async restablecerPassword(token: string, nuevaPassword: string) {
    const registro = this.tokensRecuperacion.get(token);
    if (!registro || registro.expira < Date.now()) {
      this.tokensRecuperacion.delete(token);
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
    const actualizado = this.usersService.actualizar(registro.usuarioId, {
      passwordHash,
    });
    this.tokensRecuperacion.delete(token);
    if (!actualizado) {
      throw new BadRequestException('Token inválido o expirado');
    }
    // Nunca se devuelve passwordHash.
    return { mensaje: 'Contraseña actualizada' };
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
