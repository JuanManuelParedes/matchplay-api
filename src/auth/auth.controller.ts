import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import {
  RecuperarPasswordDto,
  RestablecerPasswordDto,
} from './dto/recuperar-password.dto';

/**
 * Rutas públicas de autenticación (no requieren token).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registro(@Body() datos: RegistroDto) {
    return this.authService.registrar(datos);
  }

  @Post('login')
  login(@Body() datos: LoginDto) {
    return this.authService.login(datos);
  }

  @Post('logout')
  @HttpCode(200)
  logout() {
    return this.authService.logout();
  }

  @Post('recuperar-password')
  recuperarPassword(@Body() datos: RecuperarPasswordDto) {
    return this.authService.recuperarPassword(datos.correo);
  }

  @Post('restablecer-password')
  restablecerPassword(@Body() datos: RestablecerPasswordDto) {
    return this.authService.restablecerPassword(
      datos.token,
      datos.passwordNueva,
    );
  }
}