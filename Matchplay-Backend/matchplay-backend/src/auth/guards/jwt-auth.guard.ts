import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Aplica `securitySchemes.bearerAuth` del spec. Se usa con
 * @UseGuards(JwtAuthGuard) en todos los endpoints que no estén en la
 * lista `security: []` (registro, login, recuperar/restablecer-password,
 * y GET /deportes).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
