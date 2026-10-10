# Reporte de Pruebas del Backend de MatchPlay (versión corregida)

Se validó la versión del backend con las 7 correcciones críticas aplicadas, usando **154 pruebas automatizadas de extremo a extremo** contra un servidor real (NestJS + TypeScript), más verificaciones de compilación, seguridad y dependencias. Los **43 endpoints** del contrato fueron ejercitados (43/43).

**Resultado: 154/154 pruebas pasan.** Las mismas pruebas ejecutadas contra el código original fallan en **33** casos, lo que confirma que las correcciones funcionan y que las pruebas detectan los bugs reales.

Además se encontraron **puntos nuevos que el documento anterior no mencionaba** (secciones 🔴 y 🟠). Estos no se corrigieron: solo se reportan.

| Dato | Valor |
|---|---|
| Fecha | 10/10/2026 |
| Entorno | Node v22.22.2 en Linux (no en Windows/PowerShell) |
| Almacenamiento | En memoria (se pierde al reiniciar) |
| Pruebas | 154 PASS / 0 FAIL (código corregido) · 125 PASS / 33 FAIL (código original; el total es 158 porque cada valor inválido de `limite` que falla se cuenta aparte) |
| Endpoints ejercitados | 43/43 |
| Repetibilidad | Se ejecutó dos veces seguidas sobre el mismo servidor sin conflictos |

---

## 🟢 Aspectos Correctos

* **Compilación:** `tsc --noEmit` y `nest build` terminan sin errores.
* **Cobertura de Endpoints:** los 43 endpoints responden y fueron ejercitados (5 de Auth + 1 Deportes + 4 Perfiles + 2 Matches + 10 Eventos + 4 Chats + 17 Cuenta).
* **Control de Acceso:** los 37 endpoints protegidos devuelven `401` sin token y con token inválido. Los tokens firmados con otro secreto, expirados, con `alg=none` y los de cuentas eliminadas son rechazados.
* **Sin Fugas de Datos:** ninguna respuesta de las 154 pruebas incluye la clave `passwordHash` ni un hash bcrypt. Los perfiles públicos y la lista de participantes no exponen `correo`.
* **Formato de Errores Uniforme:** todos los errores, incluido el `404` de una ruta inexistente y el `400` de JSON mal formado, siguen la forma `{ error: { codigo, mensaje } }`.
* **Validación de Entrada:** `forbidNonWhitelisted` rechaza campos desconocidos; los valores fuera de rango o de tipo incorrecto devuelven `400` (edad < 13, contraseña corta, día de la semana inválido, `limite=abc`, etc.). Un objeto en lugar de string en el login devuelve `400`.
* **No se Filtran Cuentas:** contraseña errónea y correo inexistente dan el mismo `401`; `/recuperar-password` responde igual exista o no la cuenta.
* **Orden de Rutas:** `/perfiles/feed` y `/eventos/mios` no son capturadas por `/:id`.
* **Modo Producción:** con `NODE_ENV=production` el token de recuperación **no** se devuelve en la respuesta.
* **Ciclo de Vida de Eventos:** borrador → publicado → cancelado, join/salir, cupo lleno y reglas del creador funcionan como se espera.

### Verificación de las 7 correcciones críticas del documento anterior

| # | Corrección | Código original | Código corregido |
|---|---|---|---|
| 1 | Bloqueos ya no se comparten entre usuarios | ❌ falla | ✅ pasa |
| 2 | Restablecer contraseña: genera token de un solo uso, lo valida, actualiza la contraseña y no expone `passwordHash` | ❌ falla (7 pruebas) | ✅ pasa |
| 3 | DTOs compatibles con Insomnia: `nuevaPassword`, `nombreUsuario`, `verificacionPerfil` | ❌ falla | ✅ pasa |
| 4 | Solo el destinatario responde una propuesta de evento | ❌ falla | ✅ pasa |
| 5 | `GET /eventos/mios` con `rol` y `estado` | ❌ falla (5 pruebas) | ✅ pasa |
| 6 | Like propio, match duplicado, `pass` persistente, filtros `deporte`/`limite`, deshacer match | ❌ falla (12 pruebas) | ✅ pasa |
| 7 | Borradores ajenos ocultos, evento cancelado no editable, cupo no menor a inscritos | ❌ falla (5 pruebas) | ✅ pasa |

---

## 🔴 Puntos Críticos (Rompen Funcionalidad o Seguridad)

Estos puntos **no estaban en el documento anterior** y se reprodujeron con pruebas.

1. **Los Bloqueos no Tienen Ningún Efecto:**
   * Un perfil bloqueado sigue apareciendo en el feed de quien lo bloqueó.
   * Un usuario bloqueado puede dar *like* a quien lo bloqueó, formar *match* y generar el chat.
   * `bloqueadosIds` solo se usa para listar y administrar la lista; ningún otro módulo lo consulta.
2. **Los Ajustes de Privacidad no se Aplican:**
   * Con `perfilVisibleEnBusqueda = false` el usuario sigue apareciendo en el feed de los demás.
   * Con `mostrarEdad = false` la edad sigue visible en el perfil público.
3. **Secreto JWT por Defecto (`dev-secret`):**
   * Si el servidor arranca sin `JWT_SECRET` (por ejemplo, sin archivo `.env`), usa `dev-secret`. Se verificó que un token forjado con ese secreto es **aceptado** y permite suplantar a cualquier usuario.
   * Con un secreto distinto, el token forjado sí es rechazado, así que el riesgo depende de la configuración.

---

## 🟠 Lógica, Contrato o Robustez Incompletos

* **Cuentas Duplicadas:**
  * Dos cuentas pueden tener el mismo `nombreUsuario`, tanto al registrarse como con `PATCH /me`.
  * El correo distingue mayúsculas: `A@x.com` y `a@x.com` son cuentas distintas.
* **Validación Débil:**
  * `PATCH /me` acepta `edad` menor a 13 (el registro sí lo impide).
  * No hay límite de longitud en textos: se aceptó un `nombreUsuario` de 50.000 caracteres.
  * Un cuerpo de 300 KB devuelve `500 INTERNAL_SERVER_ERROR` en lugar de `413`, porque el filtro de errores trata los errores de `body-parser` como fallos internos.
* **Reglas de Eventos Faltantes:**
  * Se acepta un `deporte` que no está en el catálogo.
  * Se acepta una `fechaHora` en el pasado.
  * `nivelRequerido` no se aplica: un usuario Principiante puede unirse a un evento "Avanzado".
* **Datos Huérfanos:**
  * Al eliminar una cuenta, sus eventos siguen publicados y `GET /matches` devuelve `perfil: null` en los matches que tenía.
  * Al deshacer un match, el chat sigue existiendo.
* **Chat por Autoservicio Pendiente:** unirse a un evento personal sin haber chateado antes no crea el chat con el creador. El código ya lo documenta como pendiente (nota en `ChatsModule`).
* **Endurecimiento de Seguridad:**
  * No hay límite de intentos de login (30 fallidos seguidos sin bloqueo ni `429`).
  * CORS abierto a cualquier origen (`Access-Control-Allow-Origin: *`).
  * Se expone la cabecera `X-Powered-By: Express` y faltan cabeceras de seguridad (por ejemplo `X-Content-Type-Options`).
* **Dependencias Vulnerables (`npm audit --omit=dev`):** 13 vulnerabilidades (1 crítica, 5 altas, 6 moderadas, 1 baja). La crítica corresponde a `tar`, que llega por la cadena de instalación de `bcrypt`. Todos los arreglos que sugiere `npm audit fix --force` son cambios de versión mayor (NestJS 12, bcrypt 6, uuid 14), así que no conviene aplicarlos a ciegas.
* **Token de Recuperación en la Respuesta:** mientras `NODE_ENV` no sea `production`, `/recuperar-password` devuelve el token en el body (decisión de desarrollo, ya que no hay envío de correo). Debe sustituirse por envío real antes de desplegar.
* **Calidad del Repositorio:**
  * No hay pruebas unitarias (0 archivos `.spec.ts`; `jest` no encuentra nada).
  * El script `npm run lint` no funciona: `eslint` no está en `devDependencies` y no hay configuración.
  * El README menciona Swagger en `/api/docs`, pero `@nestjs/swagger` no está instalado ni configurado.
  * El README pide `cp .env.example .env`, pero ese archivo no venía en el repositorio original (ya se agregó).

---

## ⚪ Lo que no se Pudo Validar

* **Contrato de Insomnia / YAML:** no se dispone de él. En los puntos donde el documento anterior no precisaba el comportamiento, se eligió uno razonable:
  * Borrador ajeno responde `404` (no `403`).
  * `rol=participante` lista los eventos donde estás inscrito **sin** los que creaste.
  * `rol`, `estado` y `limite` inválidos responden `400`.
  * `verificacionPerfil` se acepta en el body pero no se guarda.
* **Sección "Lógica o Contrato Incompleto" del documento anterior:** el texto llegó cortado en "Cancelación de Eventos: El parámetro `mot…", así que esa parte no está verificada.
* **Entorno:** las pruebas se ejecutaron en Linux, no en Windows. Tampoco se probó rendimiento bajo carga, base de datos real ni el frontend.

---

## Calidad de las Pruebas

Las pruebas se validaron a sí mismas antes de entregar este reporte:

* Se ejecutaron contra el código **original**: fallaron 33 casos, todos vinculados a bugs reales.
* Esa comparación destapó una prueba débil (el límite de cupo usaba `cupoMaximo: 1`, que el DTO ya rechazaba por `@Min(2)` aunque la regla nueva no existiera). Se reescribió con un valor que sí pasa el DTO y ahora falla en el original y pasa en el corregido.
* Un falso positivo en el detector de fugas (confundía el mensaje de error "property passwordHash should not exist" con una fuga real) se corrigió: ahora solo cuenta la clave `passwordHash` como dato o un hash bcrypt real.

---

## Cómo Reproducir

Con el servidor corriendo en otra ventana (`npm run start:dev`):

```powershell
node scripts\pruebas-api.mjs
```

El script imprime `PASS`/`FAIL` por prueba, el total de endpoints cubiertos y una sección final de **hallazgos** (`H1`–`H15`) que aparecen como `CONFIRMADO` mientras el comportamiento siga presente. Cuando corrijas uno, debería pasar a `no se reproduce`. El código de salida es `0` si todo pasa y `1` si alguna prueba falla.
