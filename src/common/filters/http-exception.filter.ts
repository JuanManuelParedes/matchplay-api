import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Traduce cualquier excepción (HttpException o no) a la forma del schema
 * `Error` definido en matchplay-api-unificada: { error: { codigo, mensaje } }.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const respuesta =
      exception instanceof HttpException ? exception.getResponse() : null;

    const mensaje =
      typeof respuesta === 'string'
        ? respuesta
        : (respuesta as any)?.message ?? 'Error interno del servidor';

    response.status(status).json({
      error: {
        codigo: HttpStatus[status] ?? 'ERROR_DESCONOCIDO',
        mensaje: Array.isArray(mensaje) ? mensaje.join(', ') : mensaje,
      },
    });
  }
}
