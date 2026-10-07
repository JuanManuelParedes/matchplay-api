export interface JwtPayload {
  /** id del usuario (sub = subject, convención estándar de JWT) */
  sub: string;
  nombreUsuario: string;
}
