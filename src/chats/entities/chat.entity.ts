import { Mensaje } from './mensaje.entity';

export interface Chat {
  id: string;
  usuarioIdA: string;
  usuarioIdB: string;
  mensajes: Mensaje[];
  creadoEn: Date;
}
