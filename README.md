# MatchPlay Backend

Backend de MatchPlay construido con **NestJS + TypeScript**, siguiendo el
patrón estándar de Nest: cada dominio es un **módulo** con su
**controlador** (rutas HTTP) y su **servicio** (lógica de negocio),
mapeado 1 a 1 contra `matchplay-api-unificada.yaml`.

**Los 43 endpoints del contrato están implementados** en 7 módulos y
fueron probados contra un servidor real (no solo compilados).

## Cómo correrlo

```bash
npm install
cp .env.example .env
npm run start:dev
```

- API en `http://localhost:3000/api`
- Documentación Swagger (generada desde los mismos decoradores del
  código, no es el YAML estático) en `http://localhost:3000/api/docs`

## Estructura

```
src/
  auth/        Tag "Auth" (5): registro, login, logout, recuperar/restablecer password.
               Exporta UsersService (repositorio de usuarios en memoria)
               y JwtStrategy/JwtAuthGuard, usados por el resto de módulos.
  deportes/    Tag "Deportes" (1): catálogo fijo de deportes.
  perfiles/    Tag "Perfiles" (4): feed de swipe, detalle, like, pass.
               Al hacer like mutuo delega en MatchesService y crea el
               chat correspondiente vía ChatsService.
  matches/     Tag "Matches" (2): listar y deshacer matches.
  eventos/     Tag "Eventos" (10): el módulo más grande. Ciclo de vida
               completo borrador → publicado → cancelado, join/salir
               por autoservicio, participantes.
  chats/       Tag "Chats" (4): listar chats, historial de mensajes,
               enviar mensaje (texto o propuesta_evento), responder una
               propuesta ("Sí quiero" dispara EventosService.unirse()).
  cuenta/      Tag "Cuenta" (17): todo bajo /me — perfil propio,
               preferencias deportivas, horario disponible,
               notificaciones, privacidad, bloqueados, idioma, tema.
  common/      Filtro de excepciones (normaliza errores al schema
               `Error`), decorador @CurrentUser(), interfaz JwtPayload.
```

Cada módulo sigue el mismo patrón:
`*.module.ts` (ensambla todo) → `*.controller.ts` (rutas + validación de
DTOs) → `*.service.ts` (reglas de negocio) → `entities/` (forma de los
datos) → `dto/` (lo que puede llegar en el body/query, validado con
`class-validator`).

## Decisiones de diseño

- **Persistencia**: por ahora cada servicio guarda sus datos en un
  arreglo en memoria (se pierden al reiniciar el servidor). Es
  intencional para esta etapa del proyecto: permite probar los 43
  endpoints del contrato sin montar una base de datos todavía. El
  siguiente paso natural es agregar Prisma o TypeORM con Postgres y
  reemplazar únicamente los métodos de cada `*.service.ts` — los
  controladores no cambiarían.
- **Autenticación**: JWT sin estado (`@nestjs/jwt` + `passport-jwt`).
  `POST /auth/logout` no invalida nada en el servidor porque no hay
  sesión que borrar; el cliente simplemente descarta el token.
- **Modelo de Eventos**: un evento se crea en `borrador` y
  `POST /eventos/:id/publicar` lo pasa a `publicado`. La pantalla
  "Crear evento" (botón único "Publicar evento") hace ambas llamadas en
  la misma interacción del usuario, pero quedan como dos pasos de API
  independientes para poder guardar un borrador sin publicarlo.
- **Invitación por chat vs. autoservicio**: no existe un recurso
  `/invitaciones`. Proponer un evento es un mensaje de chat
  (`tipo: propuesta_evento`); aceptarlo llama internamente al mismo
  `EventosService.unirse()` que usa el botón "Unirme" de la pantalla
  Eventos. Ambos caminos terminan en el mismo punto de entrada al
  dominio, y por eso respetan las mismas reglas (evento publicado,
  cupo disponible).
- **Chat automático al hacer match**: `PerfilesService.like()` llama a
  `ChatsService.obtenerOCrearChat()` cuando el like es mutuo
  (`Perfiles -> Chats -> Eventos`, una sola dirección, sin ciclos).
  **Pendiente**: el chat automático al unirse *directamente* a un
  partido personal desde la pantalla Eventos (sin haber chateado antes)
  no está conectado, porque exigiría que `EventosModule` importara
  `ChatsModule`, creando el ciclo `Eventos <-> Chats`. La forma correcta
  de resolverlo es un `EventEmitterModule` de Nest (Eventos emite
  `evento.participante_unido`, Chats escucha) en vez de un
  `forwardRef()` circular; queda documentado en `chats.module.ts`.
- **Estado "en línea" del chat**: el campo `enLinea` en la respuesta de
  `GET /chats` siempre devuelve `false` por ahora — requiere trackear
  sockets/heartbeats, fuera del alcance de este corte (ver TODO en
  `chats.controller.ts`).
- **Errores**: un filtro global (`HttpExceptionFilter`) convierte
  cualquier excepción de Nest a la forma `{ "error": { "codigo",
  "mensaje" } }` del schema `Error`, así todos los endpoints responden
  errores con la misma forma sin repetir ese código en cada servicio.

## Siguiente paso natural

Con los 43 endpoints ya implementados y probados, lo que falta es
infraestructura, no funcionalidad:

1. Reemplazar los repositorios en memoria por Prisma/TypeORM + Postgres.
2. Resolver el TODO del chat automático en eventos personales con
   `EventEmitterModule`.
3. Tests automatizados (unitarios por servicio, e2e por módulo) en vez
   de las pruebas manuales con `curl` hechas durante el desarrollo.
