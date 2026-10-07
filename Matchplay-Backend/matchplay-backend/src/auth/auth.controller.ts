import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import {
  RecuperarPasswordDto,
  RestablecerPasswordDto,
} from './dto/recuperar-password.dto';

/**
 * Mapea 1 a 1 el tag "Auth" de matchplay-api-unificada.yaml.
 * Todas las rutas aquí tienen `security: []` en el spec (son públicas).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Crear cuenta (pasos 1 y 2 combinados)' })
  registro(@Body() datos: RegistroDto) {
    return this.authService.registrar(datos);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() datos: LoginDto) {
    return this.authService.login(datos);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cerrar sesión' })
  logout() {
    return this.authService.logout();
  }

  @Post('recuperar-password')
  @ApiOperation({ summary: 'Solicitar enlace de recuperación de contraseña' })
  recuperarPassword(@Body() datos: RecuperarPasswordDto) {
    return this.authService.recuperarPassword(datos.correo);
  }

  @Post('restablecer-password')
  @ApiOperation({ summary: 'Definir una nueva contraseña con el token recibido' })
  restablecerPassword(@Body() datos: RestablecerPasswordDto) {
    return this.authService.restablecerPassword(
      datos.token,
      datos.passwordNueva,
    );
  }
}
