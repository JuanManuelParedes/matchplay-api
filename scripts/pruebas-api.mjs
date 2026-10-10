/**
 * Pruebas de extremo a extremo de la API de MatchPlay.
 *
 * Uso (con el servidor corriendo en otra ventana):
 *   node scripts/pruebas-api.mjs
 *   $env:BASE_URL="http://localhost:3000/api"; node scripts/pruebas-api.mjs
 *
 * Requiere Node 18+ (usa fetch nativo). No necesita dependencias.
 * Es seguro repetirlo: cada ejecución usa usuarios con nombres únicos.
 * Código de salida: 0 si todas las pruebas pasan, 1 si alguna falla.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000/api';
const RUN = Date.now().toString(36);

// ---- Los 43 endpoints del contrato ------------------------------------------
const ENDPOINTS = [
  'POST /auth/registro', 'POST /auth/login', 'POST /auth/logout',
  'POST /auth/recuperar-password', 'POST /auth/restablecer-password',
  'GET /deportes',
  'GET /perfiles/feed', 'GET /perfiles/:id', 'POST /perfiles/:id/like', 'POST /perfiles/:id/pass',
  'GET /matches', 'DELETE /matches/:id',
  'GET /eventos', 'POST /eventos', 'GET /eventos/mios', 'GET /eventos/:id', 'PATCH /eventos/:id',
  'POST /eventos/:id/publicar', 'POST /eventos/:id/cancelar', 'POST /eventos/:id/join',
  'DELETE /eventos/:id/join', 'GET /eventos/:id/participantes',
  'GET /chats', 'GET /chats/:id/mensajes', 'POST /chats/:id/mensajes', 'POST /chats/:id/mensajes/:id/responder',
  'GET /me', 'PATCH /me', 'DELETE /me', 'GET /me/datos',
  'GET /me/preferencias-deportivas', 'PUT /me/preferencias-deportivas',
  'GET /me/horario-disponible', 'PUT /me/horario-disponible',
  'GET /me/notificaciones', 'PATCH /me/notificaciones',
  'GET /me/privacidad', 'PATCH /me/privacidad',
  'GET /me/bloqueados', 'POST /me/bloqueados', 'DELETE /me/bloqueados/:id',
  'PUT /me/idioma', 'PUT /me/tema',
];
const PUBLICOS = new Set(['POST /auth/registro', 'POST /auth/login', 'POST /auth/logout',
  'POST /auth/recuperar-password', 'POST /auth/restablecer-password', 'GET /deportes']);

// ---- Utilidades --------------------------------------------------------------
const cubiertos = new Set();
const fugas = [];
let pasaron = 0, fallaron = 0;
const fallas = [];
const hallazgos = [];

async function api(ep, path, { body, tok } = {}) {
  cubiertos.add(ep);
  const metodo = ep.split(' ')[0];
  const res = await fetch(BASE + path, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  let j = null;
  try { j = texto ? JSON.parse(texto) : null; } catch { j = texto; }
  // Fuga = la clave passwordHash como dato, o un hash bcrypt real. (Un mensaje de
  // error que solo menciona la palabra "passwordHash" no cuenta.)
  const tieneClave = (o) => o && typeof o === 'object' && (Object.hasOwn(o, 'passwordHash') || Object.values(o).some(tieneClave));
  if (tieneClave(j) || /\$2[aby]\$\d\d\$/.test(texto)) fugas.push(`${ep} (${path})`);
  return { s: res.status, j };
}
const seccion = (t) => console.log(`\n=== ${t} ===`);
function ok(cond, nombre) {
  if (cond) { pasaron++; console.log('  PASS  ' + nombre); }
  else { fallaron++; fallas.push(nombre); console.log('  FAIL  ' + nombre); }
}
function hallazgo(reproduce, nombre) {
  hallazgos.push({ reproduce, nombre });
  console.log(`  ${reproduce ? 'CONFIRMADO' : 'no se reproduce'}  ${nombre}`);
}
const esErrorValido = (r) => r.j && r.j.error && typeof r.j.error.codigo === 'string' && typeof r.j.error.mensaje === 'string';

let contador = 0;
async function nuevoUsuario(prefijo, deportes = ['Tenis']) {
  const n = `${prefijo}${RUN}${contador++}`;
  const datos = { nombreUsuario: n, correo: `${n}@test.com`, password: '12345678', edad: 22, deportesFavoritos: deportes, aceptaTerminos: true };
  const r = await api('POST /auth/registro', '/auth/registro', { body: datos });
  return { n, correo: datos.correo, tok: r.j?.token, id: r.j?.usuario?.id, reg: r };
}
async function hacerMatch(a, b) {
  await api('POST /perfiles/:id/like', `/perfiles/${b.id}/like`, { tok: a.tok });
  const r = await api('POST /perfiles/:id/like', `/perfiles/${a.id}/like`, { tok: b.tok });
  const chats = await api('GET /chats', '/chats', { tok: a.tok });
  const chat = chats.j.find((c) => c.perfil?.id === b.id);
  return { matchId: r.j.matchId, chatId: chat?.id };
}
const evento = (o = {}) => ({ tipo: 'comunidad', titulo: 'Partido', deporte: 'Tenis', fechaHora: '2030-12-01T10:00:00Z', lugar: 'Cancha 1', cupoMaximo: 4, ...o });
async function eventoPublicado(creador, o = {}) {
  const e = (await api('POST /eventos', '/eventos', { body: evento(o), tok: creador.tok })).j;
  await api('POST /eventos/:id/publicar', `/eventos/${e.id}/publicar`, { tok: creador.tok });
  return e;
}

// =============================================================================
const ana = await nuevoUsuario('ana'), bob = await nuevoUsuario('bob', ['Fútbol 5']), cami = await nuevoUsuario('cami'), dani = await nuevoUsuario('dani');

seccion('1. Disponibilidad y rutas públicas');
{
  const r = await api('GET /deportes', '/deportes');
  ok(r.s === 200 && Array.isArray(r.j) && r.j.length === 6, 'GET /deportes (sin token) devuelve 6 deportes');
  ok(r.j?.every((d) => d.id && d.nombre && typeof d.disponibles === 'number'), 'cada deporte tiene id, nombre y disponibles');
  const nf = await fetch(BASE + '/ruta-que-no-existe');
  const j = await nf.json();
  ok(nf.status === 404 && j.error?.codigo, 'ruta inexistente -> 404 con formato { error: { codigo, mensaje } }');
}

seccion('2. Seguridad: endpoints protegidos exigen token');
{
  let todos = true; const sinProteger = [];
  for (const ep of ENDPOINTS.filter((e) => !PUBLICOS.has(e))) {
    const [m, ruta] = ep.split(' ');
    const path = ruta.replace(/:id/g, 'x');
    const r1 = await api(ep, path, { body: m === 'GET' || m === 'DELETE' ? undefined : {} });
    const r2 = await api(ep, path, { tok: 'token.invalido.123', body: m === 'GET' || m === 'DELETE' ? undefined : {} });
    if (r1.s !== 401 || r2.s !== 401) { todos = false; sinProteger.push(ep); }
  }
  ok(todos, `los ${ENDPOINTS.length - PUBLICOS.size} endpoints protegidos devuelven 401 sin token y con token inválido` + (sinProteger.length ? ` (fallan: ${sinProteger.join(', ')})` : ''));
}

seccion('3. Auth: registro y login');
{
  ok(ana.reg.s === 201 && ana.reg.j.token && ana.reg.j.usuario?.id, 'registro -> 201 con token y usuario');
  ok(!('passwordHash' in (ana.reg.j.usuario ?? {})), 'registro no expone passwordHash');
  const base = { nombreUsuario: 'x' + RUN, correo: `x${RUN}@t.com`, password: '12345678', edad: 20, deportesFavoritos: ['Tenis'], aceptaTerminos: true };
  let r = await api('POST /auth/registro', '/auth/registro', { body: { ...base, correo: ana.correo } });
  ok(r.s === 409 && esErrorValido(r), 'correo repetido -> 409');
  r = await api('POST /auth/registro', '/auth/registro', { body: { ...base, campoExtra: 1 } });
  ok(r.s === 400, 'campo no permitido en el body -> 400 (forbidNonWhitelisted)');
  r = await api('POST /auth/registro', '/auth/registro', { body: { ...base, edad: 12 } });
  ok(r.s === 400, 'edad menor a 13 -> 400');
  r = await api('POST /auth/registro', '/auth/registro', { body: { ...base, password: '123' } });
  ok(r.s === 400, 'password de menos de 8 caracteres -> 400');
  r = await api('POST /auth/registro', '/auth/registro', { body: { ...base, aceptaTerminos: false } });
  ok(r.s === 400, 'aceptaTerminos=false -> 400');
  r = await api('POST /auth/registro', '/auth/registro', { body: { ...base, correo: 'no-es-correo' } });
  ok(r.s === 400, 'correo con formato inválido -> 400');
  r = await api('POST /auth/registro', '/auth/registro', { body: { ...base, deportesFavoritos: [] } });
  ok(r.s === 400, 'deportesFavoritos vacío -> 400');

  r = await api('POST /auth/login', '/auth/login', { body: { correo: ana.correo, password: '12345678' } });
  ok(r.s === 201 && r.j.token, 'login correcto -> token');
  const e1 = await api('POST /auth/login', '/auth/login', { body: { correo: ana.correo, password: 'incorrecta1' } });
  const e2 = await api('POST /auth/login', '/auth/login', { body: { correo: 'nadie@nada.com', password: 'incorrecta1' } });
  ok(e1.s === 401 && e2.s === 401 && e1.j.error.mensaje === e2.j.error.mensaje, 'contraseña errónea y correo inexistente dan el mismo 401 (no filtra cuentas)');
  r = await api('POST /auth/logout', '/auth/logout', { tok: ana.tok });
  ok(r.s === 200, 'logout -> 200');
}

seccion('4. Auth: recuperación y restablecimiento de contraseña');
{
  const u = await nuevoUsuario('rec');
  let r = await api('POST /auth/recuperar-password', '/auth/recuperar-password', { body: { correo: u.correo, nombreUsuario: 'otro' } });
  ok(r.s === 201 && !r.j.token, 'nombreUsuario que no coincide: misma respuesta y sin token');
  r = await api('POST /auth/recuperar-password', '/auth/recuperar-password', { body: { correo: 'nadie@nada.com', nombreUsuario: 'x' } });
  ok(r.s === 201 && !r.j.token, 'correo inexistente: misma respuesta (no revela cuentas)');
  r = await api('POST /auth/recuperar-password', '/auth/recuperar-password', { body: { correo: u.correo } });
  ok(r.s === 400, 'falta nombreUsuario -> 400');
  r = await api('POST /auth/recuperar-password', '/auth/recuperar-password', { body: { correo: u.correo, nombreUsuario: u.n } });
  const token = r.j.token;
  ok(r.s === 201 && !!token, 'datos coincidentes: se genera token (modo desarrollo)');
  r = await api('POST /auth/restablecer-password', '/auth/restablecer-password', { body: { token: 'falso', nuevaPassword: 'nuevaclave1' } });
  ok(r.s === 400, 'token falso -> 400');
  r = await api('POST /auth/restablecer-password', '/auth/restablecer-password', { body: { token, passwordNueva: 'nuevaclave1' } });
  ok(r.s === 400, 'campo antiguo passwordNueva ya no es válido -> 400');
  r = await api('POST /auth/restablecer-password', '/auth/restablecer-password', { body: { token, nuevaPassword: 'corta' } });
  ok(r.s === 400, 'nuevaPassword corta -> 400 (y el token NO se consume)');
  r = await api('POST /auth/restablecer-password', '/auth/restablecer-password', { body: { token, nuevaPassword: 'nuevaclave1' } });
  ok(r.s === 201 && !JSON.stringify(r.j).includes('passwordHash'), 'restablecer correcto -> 201 sin passwordHash');
  r = await api('POST /auth/login', '/auth/login', { body: { correo: u.correo, password: 'nuevaclave1' } });
  ok(r.s === 201, 'login con la contraseña nueva funciona');
  r = await api('POST /auth/login', '/auth/login', { body: { correo: u.correo, password: '12345678' } });
  ok(r.s === 401, 'la contraseña anterior deja de funcionar');
  r = await api('POST /auth/restablecer-password', '/auth/restablecer-password', { body: { token, nuevaPassword: 'otraclave22' } });
  ok(r.s === 400, 'el token es de un solo uso');
}

seccion('5. Cuenta (/me): perfil, datos y preferencias');
{
  let r = await api('GET /me', '/me', { tok: ana.tok });
  ok(r.s === 200 && r.j.id === ana.id && r.j.correo === ana.correo, 'GET /me devuelve el perfil propio');
  r = await api('PATCH /me', '/me', { tok: ana.tok, body: { nombreCompleto: 'Ana Pérez', ciudad: 'Cali', sobreMi: 'Hola' } });
  ok(r.s === 200 && r.j.ciudad === 'Cali' && r.j.nombreCompleto === 'Ana Pérez', 'PATCH /me actualiza campos');
  r = await api('PATCH /me', '/me', { tok: ana.tok, body: { fotoUrl: 'no-es-url' } });
  ok(r.s === 400, 'PATCH /me con fotoUrl inválida -> 400');
  r = await api('PATCH /me', '/me', { tok: ana.tok, body: { passwordHash: 'x' } });
  ok(r.s === 400, 'PATCH /me no permite escribir passwordHash');
  r = await api('GET /me/datos', '/me/datos', { tok: ana.tok });
  ok(r.s === 200 && r.j.correo === ana.correo, 'GET /me/datos descarga los datos del usuario');

  r = await api('GET /me/preferencias-deportivas', '/me/preferencias-deportivas', { tok: ana.tok });
  ok(r.s === 200 && Array.isArray(r.j.deportesFavoritos), 'GET preferencias deportivas');
  r = await api('PUT /me/preferencias-deportivas', '/me/preferencias-deportivas', { tok: ana.tok, body: { deportesFavoritos: ['Tenis', 'Pádel'], nivel: 'Avanzado', radioBusquedaKm: 25 } });
  ok(r.s === 200 && r.j.nivel === 'Avanzado' && r.j.radioBusquedaKm === 25, 'PUT preferencias deportivas');
  r = await api('PUT /me/preferencias-deportivas', '/me/preferencias-deportivas', { tok: ana.tok, body: { deportesFavoritos: [], nivel: 'Avanzado', radioBusquedaKm: 25 } });
  ok(r.s === 400, 'PUT preferencias con deportes vacíos -> 400');
  r = await api('PUT /me/preferencias-deportivas', '/me/preferencias-deportivas', { tok: ana.tok, body: { deportesFavoritos: ['Tenis'], nivel: 'Experto', radioBusquedaKm: 25 } });
  ok(r.s === 400, 'PUT preferencias con nivel inválido -> 400');

  r = await api('PUT /me/horario-disponible', '/me/horario-disponible', { tok: ana.tok, body: { dias: ['Lunes', 'Sábado'], franjaHoraria: 'Noche', notas: 'después de 7' } });
  ok(r.s === 200 && r.j.dias.length === 2, 'PUT horario disponible');
  r = await api('GET /me/horario-disponible', '/me/horario-disponible', { tok: ana.tok });
  ok(r.s === 200 && r.j.franjaHoraria === 'Noche', 'GET horario disponible refleja el cambio');
  r = await api('PUT /me/horario-disponible', '/me/horario-disponible', { tok: ana.tok, body: { dias: ['Funday'] } });
  ok(r.s === 400, 'horario con día inválido -> 400');

  r = await api('GET /me/notificaciones', '/me/notificaciones', { tok: ana.tok });
  ok(r.s === 200 && r.j.mensajesNuevos === true, 'GET notificaciones (valores por defecto)');
  r = await api('PATCH /me/notificaciones', '/me/notificaciones', { tok: ana.tok, body: { mensajesNuevos: false } });
  ok(r.s === 200 && r.j.mensajesNuevos === false && r.j.nuevasSolicitudes === true, 'PATCH notificaciones cambia solo lo enviado');
  r = await api('PATCH /me/notificaciones', '/me/notificaciones', { tok: ana.tok, body: { mensajesNuevos: 'si' } });
  ok(r.s === 400, 'notificaciones con valor no booleano -> 400');

  r = await api('GET /me/privacidad', '/me/privacidad', { tok: ana.tok });
  ok(r.s === 200 && r.j.verificacionPerfil === 'pendiente', 'GET privacidad');
  r = await api('PATCH /me/privacidad', '/me/privacidad', { tok: ana.tok, body: { mostrarEdad: false, verificacionPerfil: 'verificado' } });
  ok(r.s === 200 && r.j.mostrarEdad === false, 'PATCH privacidad acepta verificacionPerfil (contrato Insomnia)');
  ok(r.j.verificacionPerfil === 'pendiente', 'PATCH privacidad NO permite auto-verificarse');
  r = await api('PATCH /me/privacidad', '/me/privacidad', { tok: ana.tok, body: { verificacionPerfil: 'otro' } });
  ok(r.s === 400, 'privacidad con verificacionPerfil inválido -> 400');

  r = await api('PUT /me/idioma', '/me/idioma', { tok: ana.tok, body: { idioma: 'en' } });
  ok(r.s === 200 && r.j.idioma === 'en', 'PUT idioma');
  r = await api('PUT /me/idioma', '/me/idioma', { tok: ana.tok, body: { idioma: 'fr' } });
  ok(r.s === 400, 'idioma inválido -> 400');
  r = await api('PUT /me/tema', '/me/tema', { tok: ana.tok, body: { tema: 'oscuro' } });
  ok(r.s === 200 && r.j.tema === 'oscuro', 'PUT tema');
  r = await api('PUT /me/tema', '/me/tema', { tok: ana.tok, body: { tema: 'rosa' } });
  ok(r.s === 400, 'tema inválido -> 400');
}

seccion('6. Cuenta: bloqueados');
{
  let r = await api('POST /me/bloqueados', '/me/bloqueados', { tok: ana.tok, body: { perfilId: bob.id } });
  ok(r.s === 201 && r.j.length === 1 && r.j[0].id === bob.id, 'POST bloquear devuelve la lista actualizada');
  r = await api('POST /me/bloqueados', '/me/bloqueados', { tok: ana.tok, body: { perfilId: bob.id } });
  ok(r.s === 201 && r.j.length === 1, 'bloquear dos veces no duplica');
  r = await api('POST /me/bloqueados', '/me/bloqueados', { tok: ana.tok, body: { perfilId: ana.id } });
  ok(r.s === 400, 'no puedes bloquearte a ti mismo');
  r = await api('POST /me/bloqueados', '/me/bloqueados', { tok: ana.tok, body: { perfilId: 'usr_inexistente' } });
  ok(r.s === 404, 'bloquear un perfil inexistente -> 404');
  r = await api('GET /me/bloqueados', '/me/bloqueados', { tok: cami.tok });
  ok(r.s === 200 && r.j.length === 0, 'los bloqueos de ana no aparecen en cami (bug de referencia compartida corregido)');
  r = await api('DELETE /me/bloqueados/:id', `/me/bloqueados/${bob.id}`, { tok: ana.tok });
  ok(r.s === 204, 'DELETE desbloquear -> 204');
  r = await api('GET /me/bloqueados', '/me/bloqueados', { tok: ana.tok });
  ok(r.j.length === 0, 'tras desbloquear la lista queda vacía');
}

seccion('7. Perfiles, feed, likes y matches');
{
  let r = await api('GET /perfiles/feed', '/perfiles/feed', { tok: ana.tok });
  ok(r.s === 200 && Array.isArray(r.j) && !r.j.some((p) => p.id === ana.id), 'feed no incluye al propio usuario (y /feed no choca con /:id)');
  ok(r.j.every((p) => p.id && p.nombre && !('correo' in p) && !('passwordHash' in p)), 'el feed solo expone datos públicos');
  r = await api('GET /perfiles/:id', `/perfiles/${bob.id}`, { tok: ana.tok });
  ok(r.s === 200 && r.j.id === bob.id, 'GET /perfiles/:id');
  r = await api('GET /perfiles/:id', '/perfiles/usr_nadie', { tok: ana.tok });
  ok(r.s === 404, 'GET /perfiles/:id inexistente -> 404');
  r = await api('GET /perfiles/feed', `/perfiles/feed?deporte=${encodeURIComponent('Fútbol 5')}`, { tok: ana.tok });
  ok(r.j.length >= 1 && r.j.every((p) => p.deporte === 'Fútbol 5'), 'feed filtra por deporte');
  r = await api('GET /perfiles/feed', '/perfiles/feed?limite=2', { tok: ana.tok });
  ok(r.j.length === 2, 'feed respeta limite');
  for (const l of ['0', '-1', 'abc', '1.5']) {
    r = await api('GET /perfiles/feed', `/perfiles/feed?limite=${l}`, { tok: ana.tok });
    if (r.s !== 400) { ok(false, `limite=${l} -> 400`); }
  }
  ok(true, 'limite inválido (0, -1, abc, 1.5) -> 400');

  r = await api('POST /perfiles/:id/like', `/perfiles/${ana.id}/like`, { tok: ana.tok });
  ok(r.s === 400, 'like al propio perfil -> 400');
  r = await api('POST /perfiles/:id/pass', `/perfiles/${ana.id}/pass`, { tok: ana.tok });
  ok(r.s === 400, 'pass al propio perfil -> 400');
  r = await api('POST /perfiles/:id/like', '/perfiles/usr_nadie/like', { tok: ana.tok });
  ok(r.s === 404, 'like a perfil inexistente -> 404');

  r = await api('POST /perfiles/:id/pass', `/perfiles/${cami.id}/pass`, { tok: ana.tok });
  ok(r.s === 201, 'pass -> 201');
  r = await api('GET /perfiles/feed', '/perfiles/feed', { tok: ana.tok });
  ok(!r.j.some((p) => p.id === cami.id), 'un perfil descartado con pass no vuelve al feed');
  r = await api('GET /perfiles/feed', '/perfiles/feed', { tok: bob.tok });
  ok(r.j.some((p) => p.id === cami.id), 'el pass de ana no afecta el feed de bob');

  r = await api('POST /perfiles/:id/like', `/perfiles/${dani.id}/like`, { tok: ana.tok });
  ok(r.s === 201 && r.j.match === false, 'like sin reciprocidad -> match=false');
  const m1 = await api('POST /perfiles/:id/like', `/perfiles/${ana.id}/like`, { tok: dani.tok });
  ok(m1.j.match === true && m1.j.matchId, 'like recíproco -> match=true');
  const m2 = await api('POST /perfiles/:id/like', `/perfiles/${ana.id}/like`, { tok: dani.tok });
  ok(m2.j.matchId === m1.j.matchId, 'repetir el like devuelve el mismo match');
  r = await api('GET /matches', '/matches', { tok: ana.tok });
  ok(r.s === 200 && r.j.filter((m) => m.perfil?.id === dani.id).length === 1, 'GET /matches: un solo registro por pareja');
  r = await api('DELETE /matches/:id', `/matches/${m1.j.matchId}`, { tok: cami.tok });
  ok(r.s === 403, 'no se puede deshacer un match ajeno -> 403');
  r = await api('DELETE /matches/:id', '/matches/match_nadie', { tok: ana.tok });
  ok(r.s === 404, 'deshacer match inexistente -> 404');
  r = await api('DELETE /matches/:id', `/matches/${m1.j.matchId}`, { tok: ana.tok });
  ok(r.s === 204, 'DELETE /matches/:id -> 204');
  const m3 = await api('POST /perfiles/:id/like', `/perfiles/${ana.id}/like`, { tok: dani.tok });
  ok(m3.j.match === false, 'tras deshacer, un like nuevo no recrea el match al instante');
}

seccion('8. Eventos: ciclo de vida y reglas');
{
  const A = await nuevoUsuario('ev'), B = await nuevoUsuario('ev'), C = await nuevoUsuario('ev'), D = await nuevoUsuario('ev');
  let r = await api('POST /eventos', '/eventos', { tok: A.tok, body: evento() });
  const e = r.j;
  ok(r.s === 201 && e.estado === 'borrador' && e.cuposOcupados === 1 && e.creadorId === A.id, 'crear evento -> borrador con 1 cupo ocupado (el creador)');
  for (const [nombre, cambio] of [['tipo inválido', { tipo: 'x' }], ['cupoMaximo < 2', { cupoMaximo: 1 }], ['fecha inválida', { fechaHora: 'mañana' }], ['sin título', { titulo: undefined }]]) {
    r = await api('POST /eventos', '/eventos', { tok: A.tok, body: { ...evento(), ...cambio } });
    ok(r.s === 400, `crear evento con ${nombre} -> 400`);
  }
  r = await api('GET /eventos', '/eventos', { tok: B.tok });
  ok(r.s === 200 && !r.j.some((x) => x.id === e.id), 'GET /eventos no lista borradores');
  r = await api('GET /eventos/:id', `/eventos/${e.id}`, { tok: B.tok });
  ok(r.s === 404, 'borrador ajeno: GET /eventos/:id -> 404');
  r = await api('GET /eventos/:id/participantes', `/eventos/${e.id}/participantes`, { tok: B.tok });
  ok(r.s === 404, 'borrador ajeno: participantes -> 404');
  r = await api('GET /eventos/:id', `/eventos/${e.id}`, { tok: A.tok });
  ok(r.s === 200, 'el creador sí ve su borrador');
  r = await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: B.tok });
  ok(r.s === 409, 'unirse a un borrador -> 409');
  r = await api('PATCH /eventos/:id', `/eventos/${e.id}`, { tok: B.tok, body: { titulo: 'hack' } });
  ok(r.s === 403 || r.s === 404, 'un no creador no puede editar el evento');
  r = await api('PATCH /eventos/:id', `/eventos/${e.id}`, { tok: A.tok, body: { titulo: 'Nuevo título', deporte: 'Pádel' } });
  ok(r.s === 200 && r.j.titulo === 'Nuevo título' && r.j.fotoUrl?.includes('padel'), 'el creador edita; cambiar deporte actualiza la foto');
  r = await api('POST /eventos/:id/publicar', `/eventos/${e.id}/publicar`, { tok: B.tok });
  ok(r.s === 403, 'un no creador no puede publicar -> 403');
  r = await api('POST /eventos/:id/publicar', `/eventos/${e.id}/publicar`, { tok: A.tok });
  ok(r.s === 201 && r.j.estado === 'publicado', 'publicar -> publicado');
  r = await api('POST /eventos/:id/publicar', `/eventos/${e.id}/publicar`, { tok: A.tok });
  ok(r.s === 409, 'publicar dos veces -> 409');
  r = await api('GET /eventos', '/eventos', { tok: B.tok });
  ok(r.j.some((x) => x.id === e.id), 'el evento publicado aparece en GET /eventos');
  r = await api('GET /eventos', `/eventos?tipo=personal`, { tok: B.tok });
  ok(!r.j.some((x) => x.id === e.id), 'filtro tipo=personal excluye un evento de comunidad');
  r = await api('GET /eventos', `/eventos?deporte=${encodeURIComponent('Pádel')}`, { tok: B.tok });
  ok(r.j.some((x) => x.id === e.id), 'filtro por deporte');
  r = await api('GET /eventos/:id', `/eventos/${e.id}`, { tok: B.tok });
  ok(r.s === 200, 'un evento publicado lo ve cualquiera');
  r = await api('GET /eventos/:id', '/eventos/evt_nadie', { tok: B.tok });
  ok(r.s === 404, 'evento inexistente -> 404');

  r = await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: B.tok });
  ok(r.s === 201 && r.j.cuposOcupados === 2, 'unirse -> 2 cupos ocupados');
  r = await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: B.tok });
  ok(r.s === 409, 'unirse dos veces -> 409');
  r = await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: A.tok });
  ok(r.s === 409, 'el creador no puede "unirse" a su propio evento -> 409');
  r = await api('GET /eventos/:id/participantes', `/eventos/${e.id}/participantes`, { tok: A.tok });
  ok(r.s === 200 && r.j.length === 2 && r.j.every((p) => p.id && p.nombre && !('correo' in p)), 'participantes: lista pública sin datos privados');
  r = await api('PATCH /eventos/:id', `/eventos/${e.id}`, { tok: A.tok, body: { cupoMaximo: 1 + 1 - 0 } });
  ok(r.s === 200, 'cupoMaximo igual a los inscritos (2) es válido');
  r = await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: C.tok });
  ok(r.s === 400, 'unirse a un evento lleno -> 400');
  // Regla real: bajar el cupo (con un valor válido para el DTO, >= 2) por debajo de los inscritos.
  r = await api('PATCH /eventos/:id', `/eventos/${e.id}`, { tok: A.tok, body: { cupoMaximo: 3 } });
  ok(r.s === 200, 'subir el cupo a 3 -> 200');
  r = await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: C.tok });
  ok(r.s === 201 && r.j.cuposOcupados === 3, 'con cupo 3 entra un tercer participante');
  r = await api('PATCH /eventos/:id', `/eventos/${e.id}`, { tok: A.tok, body: { cupoMaximo: 2 } });
  ok(r.s === 400, 'cupoMaximo (2) menor a los inscritos (3) -> 400');
  r = await api('GET /eventos/:id', `/eventos/${e.id}`, { tok: A.tok });
  ok(r.j.cupoMaximo === 3, 'el cupo rechazado no se aplicó');
  r = await api('DELETE /eventos/:id/join', `/eventos/${e.id}/join`, { tok: C.tok });
  ok(r.s === 204, 'el tercer participante sale -> 204');
  r = await api('DELETE /eventos/:id/join', `/eventos/${e.id}/join`, { tok: A.tok });
  ok(r.s === 403, 'el creador no puede salir de su evento -> 403');
  r = await api('DELETE /eventos/:id/join', `/eventos/${e.id}/join`, { tok: B.tok });
  ok(r.s === 204, 'salir del evento -> 204');
  r = await api('GET /eventos/:id', `/eventos/${e.id}`, { tok: A.tok });
  ok(r.j.cuposOcupados === 1, 'tras salir, el cupo se libera');

  r = await api('GET /eventos/mios', '/eventos/mios', { tok: A.tok });
  ok(r.s === 200 && r.j.some((x) => x.id === e.id), 'GET /eventos/mios (creador por defecto)');
  await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: B.tok });
  r = await api('GET /eventos/mios', '/eventos/mios?rol=participante', { tok: B.tok });
  ok(r.j.length === 1 && r.j[0].id === e.id, 'mios?rol=participante lista los eventos donde participo');
  r = await api('GET /eventos/mios', '/eventos/mios?rol=participante', { tok: A.tok });
  ok(r.j.length === 0, 'mios?rol=participante no incluye los que yo creé');
  r = await api('GET /eventos/mios', '/eventos/mios?estado=borrador', { tok: A.tok });
  ok(r.j.length === 0, 'mios?estado=borrador filtra por estado');
  for (const q of ['rol=otro', 'estado=raro']) {
    r = await api('GET /eventos/mios', `/eventos/mios?${q}`, { tok: A.tok });
    ok(r.s === 400, `mios?${q} -> 400`);
  }

  r = await api('POST /eventos/:id/cancelar', `/eventos/${e.id}/cancelar`, { tok: B.tok });
  ok(r.s === 403, 'un no creador no puede cancelar -> 403');
  r = await api('POST /eventos/:id/cancelar', `/eventos/${e.id}/cancelar`, { tok: A.tok });
  ok(r.s === 201 && r.j.estado === 'cancelado', 'cancelar -> cancelado');
  r = await api('POST /eventos/:id/cancelar', `/eventos/${e.id}/cancelar`, { tok: A.tok });
  ok(r.s === 409, 'cancelar dos veces -> 409');
  r = await api('PATCH /eventos/:id', `/eventos/${e.id}`, { tok: A.tok, body: { titulo: 'x' } });
  ok(r.s === 409, 'editar un evento cancelado -> 409');
  r = await api('POST /eventos/:id/join', `/eventos/${e.id}/join`, { tok: C.tok });
  ok(r.s === 409, 'unirse a un evento cancelado -> 409');
  r = await api('POST /eventos/:id/publicar', `/eventos/${e.id}/publicar`, { tok: A.tok });
  ok(r.s === 409, 'publicar un evento cancelado -> 409');
}

seccion('9. Chats y propuestas de evento');
{
  const A = await nuevoUsuario('ch'), B = await nuevoUsuario('ch', ['Fútbol 5']), C = await nuevoUsuario('ch'), D = await nuevoUsuario('ch');
  const { chatId } = await hacerMatch(A, B);
  let r = await api('GET /chats', '/chats', { tok: A.tok });
  ok(r.s === 200 && r.j.some((c) => c.id === chatId && c.perfil?.id === B.id), 'el match crea el chat automáticamente');
  r = await api('GET /chats', `/chats?deporte=${encodeURIComponent('Fútbol 5')}`, { tok: A.tok });
  ok(r.j.length === 1, 'GET /chats filtra por deporte');
  r = await api('GET /chats', '/chats', { tok: C.tok });
  ok(r.j.length === 0, 'un usuario no ve chats ajenos');

  r = await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'texto', texto: 'Hola!' } });
  ok(r.s === 201 && r.j.tipo === 'texto' && r.j.autorId === A.id, 'enviar mensaje de texto -> 201');
  r = await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'texto' } });
  ok(r.s === 400, 'texto sin contenido -> 400');
  r = await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'audio', texto: 'x' } });
  ok(r.s === 400, 'tipo de mensaje inválido -> 400');
  r = await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: C.tok, body: { tipo: 'texto', texto: 'intruso' } });
  ok(r.s === 403, 'enviar mensaje a un chat ajeno -> 403');
  r = await api('POST /chats/:id/mensajes', '/chats/chat_nadie/mensajes', { tok: A.tok, body: { tipo: 'texto', texto: 'x' } });
  ok(r.s === 404, 'chat inexistente -> 404');
  r = await api('GET /chats', '/chats', { tok: B.tok });
  ok(r.j[0]?.ultimoMensaje === 'Hola!', 'el último mensaje aparece en el resumen del chat');
  r = await api('GET /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: B.tok });
  ok(r.s === 200 && r.j.length === 1, 'GET mensajes del chat');
  r = await api('GET /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: C.tok });
  ok(r.s === 403, 'leer mensajes de un chat ajeno -> 403');

  const ev = await eventoPublicado(A, { tipo: 'personal' });
  const evAjeno = await eventoPublicado(C);
  r = await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'propuesta_evento' } });
  ok(r.s === 400, 'propuesta sin eventoId -> 400');
  r = await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'propuesta_evento', eventoId: evAjeno.id } });
  ok(r.s === 403, 'solo puedes proponer un evento que tú creaste -> 403');
  r = await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'propuesta_evento', eventoId: 'evt_nadie' } });
  ok(r.s === 404, 'proponer un evento inexistente -> 404');
  const prop = (await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'propuesta_evento', eventoId: ev.id } })).j;
  ok(prop.estadoPropuesta === 'pendiente', 'la propuesta nace en estado pendiente');

  const resp = (tok, respuesta, msg = prop.id, chat = chatId) => api('POST /chats/:id/mensajes/:id/responder', `/chats/${chat}/mensajes/${msg}/responder`, { tok, body: { respuesta } });
  r = await resp(A.tok, 'aceptar');
  ok(r.s === 403, 'el autor NO puede responder su propia propuesta -> 403');
  r = await resp(C.tok, 'aceptar');
  ok(r.s === 403, 'alguien ajeno al chat no puede responder -> 403');
  r = await api('POST /chats/:id/mensajes/:id/responder', `/chats/${chatId}/mensajes/${prop.id}/responder`, { tok: B.tok, body: { respuesta: 'quizas' } });
  ok(r.s === 400, 'respuesta inválida -> 400');
  r = await resp(B.tok, 'aceptar', 'msg_nadie');
  ok(r.s === 404, 'responder una propuesta inexistente -> 404');
  r = await resp(B.tok, 'aceptar');
  ok(r.s === 201 && r.j.estadoPropuesta === 'aceptada', 'el destinatario acepta -> aceptada');
  r = await api('GET /eventos/:id', `/eventos/${ev.id}`, { tok: A.tok });
  ok(r.j.cuposOcupados === 2, 'aceptar la propuesta suma al destinatario en el evento');
  r = await resp(B.tok, 'rechazar');
  ok(r.s === 409, 'responder dos veces -> 409');

  const ev2 = await eventoPublicado(A);
  const prop2 = (await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'propuesta_evento', eventoId: ev2.id } })).j;
  r = await resp(B.tok, 'rechazar', prop2.id);
  ok(r.s === 201 && r.j.estadoPropuesta === 'rechazada', 'rechazar -> rechazada (sin unirse)');
  r = await api('GET /eventos/:id', `/eventos/${ev2.id}`, { tok: A.tok });
  ok(r.j.cuposOcupados === 1, 'rechazar no suma participantes');

  const evLleno = await eventoPublicado(A, { cupoMaximo: 2 });
  await api('POST /eventos/:id/join', `/eventos/${evLleno.id}/join`, { tok: D.tok });
  const prop3 = (await api('POST /chats/:id/mensajes', `/chats/${chatId}/mensajes`, { tok: A.tok, body: { tipo: 'propuesta_evento', eventoId: evLleno.id } })).j;
  r = await resp(B.tok, 'aceptar', prop3.id);
  ok(r.s === 400, 'aceptar una propuesta de un evento lleno -> 400 (error propagado)');
}

seccion('10. Cuenta: eliminar y regresiones de seguridad');
{
  const X = await nuevoUsuario('del'), Y = await nuevoUsuario('del');
  let r = await api('DELETE /me', '/me', { tok: X.tok });
  ok(r.s === 204, 'DELETE /me -> 204');
  r = await api('GET /me', '/me', { tok: X.tok });
  ok(r.s === 401, 'el token de una cuenta eliminada deja de funcionar -> 401');
  r = await api('POST /auth/login', '/auth/login', { body: { correo: X.correo, password: '12345678' } });
  ok(r.s === 401, 'no se puede iniciar sesión con una cuenta eliminada');
  r = await api('GET /perfiles/feed', '/perfiles/feed', { tok: Y.tok });
  ok(!r.j.some((p) => p.id === X.id), 'la cuenta eliminada desaparece del feed');
}

seccion('11. Seguridad transversal');
ok(fugas.length === 0, 'ninguna respuesta expone passwordHash ni hashes bcrypt' + (fugas.length ? ` (fugas en: ${[...new Set(fugas)].join(', ')})` : ''));

// =============================================================================
seccion('12. HALLAZGOS: comportamientos a revisar (informativos, no afectan el resultado)');
{
  const A = await nuevoUsuario('h'), B = await nuevoUsuario('h'), C = await nuevoUsuario('h');
  let r = await api('POST /auth/registro', '/auth/registro', { body: { nombreUsuario: A.n, correo: `otro${A.n}@test.com`, password: '12345678', edad: 20, deportesFavoritos: ['Tenis'], aceptaTerminos: true } });
  hallazgo(r.s === 201, 'H1 dos cuentas pueden tener el mismo nombreUsuario');
  r = await api('POST /auth/registro', '/auth/registro', { body: { nombreUsuario: 'may' + A.n, correo: A.correo.toUpperCase(), password: '12345678', edad: 20, deportesFavoritos: ['Tenis'], aceptaTerminos: true } });
  hallazgo(r.s === 201, 'H2 el correo distingue mayúsculas (A@x.com y a@x.com son cuentas distintas)');
  await api('POST /me/bloqueados', '/me/bloqueados', { tok: A.tok, body: { perfilId: B.id } });
  r = await api('GET /perfiles/feed', '/perfiles/feed', { tok: A.tok });
  hallazgo(r.j.some((p) => p.id === B.id), 'H3 un perfil bloqueado sigue apareciendo en el feed de quien lo bloqueó');
  await api('POST /perfiles/:id/like', `/perfiles/${A.id}/like`, { tok: A.tok }).catch(() => {});
  await api('POST /perfiles/:id/like', `/perfiles/${B.id}/like`, { tok: A.tok });
  r = await api('POST /perfiles/:id/like', `/perfiles/${A.id}/like`, { tok: B.tok });
  hallazgo(r.j.match === true, 'H4 un usuario bloqueado puede formar match con quien lo bloqueó');
  await api('PATCH /me/privacidad', '/me/privacidad', { tok: C.tok, body: { perfilVisibleEnBusqueda: false, mostrarEdad: false } });
  r = await api('GET /perfiles/feed', '/perfiles/feed', { tok: B.tok });
  const pc = r.j.find((p) => p.id === C.id);
  hallazgo(!!pc, 'H5 perfilVisibleEnBusqueda=false no oculta al usuario del feed');
  hallazgo(!!pc && pc.edad !== undefined, 'H6 mostrarEdad=false no oculta la edad en el perfil público');
  r = await api('PATCH /me', '/me', { tok: C.tok, body: { edad: 5 } });
  hallazgo(r.s === 200, 'H7 PATCH /me acepta edad menor a 13 (el registro lo exige)');
  r = await api('PATCH /me', '/me', { tok: C.tok, body: { nombreUsuario: A.n } });
  hallazgo(r.s === 200, 'H8 PATCH /me permite repetir un nombreUsuario ya usado');
  r = await api('POST /eventos', '/eventos', { tok: A.tok, body: evento({ deporte: 'Ajedrez volador' }) });
  hallazgo(r.s === 201, 'H9 se puede crear un evento con un deporte que no está en el catálogo');
  r = await api('POST /eventos', '/eventos', { tok: A.tok, body: evento({ fechaHora: '2001-01-01T10:00:00Z' }) });
  hallazgo(r.s === 201, 'H10 se puede crear un evento con fecha en el pasado');
  const evAvz = await eventoPublicado(A, { nivelRequerido: 'Avanzado' });
  r = await api('POST /eventos/:id/join', `/eventos/${evAvz.id}/join`, { tok: C.tok });
  hallazgo(r.s === 201, 'H11 se puede unir a un evento "Avanzado" un usuario nivel Principiante');
  const { chatId, matchId } = await hacerMatch(B, C);
  await api('DELETE /matches/:id', `/matches/${matchId}`, { tok: B.tok });
  r = await api('GET /chats', '/chats', { tok: B.tok });
  hallazgo(r.j.some((c) => c.id === chatId), 'H12 al deshacer un match el chat sigue existiendo');
  const ev = await eventoPublicado(B, { tipo: 'personal' });
  const E = await nuevoUsuario('h');
  await api('POST /eventos/:id/join', `/eventos/${ev.id}/join`, { tok: E.tok });
  r = await api('GET /chats', '/chats', { tok: E.tok });
  hallazgo(!r.j.some((c) => c.perfil?.id === B.id), 'H13 unirse a un evento personal por autoservicio no crea chat con el creador (el código lo documenta como pendiente)');
  const D = await nuevoUsuario('h');
  const evD = await eventoPublicado(D);
  await api('DELETE /me', '/me', { tok: D.tok });
  r = await api('GET /eventos', '/eventos', { tok: B.tok });
  hallazgo(r.j.some((x) => x.id === evD.id), 'H14 los eventos de una cuenta eliminada siguen publicados');
  const nr = await api('POST /auth/recuperar-password', '/auth/recuperar-password', { body: { correo: B.correo, nombreUsuario: B.n } });
  hallazgo(!!nr.j.token, 'H15 el token de recuperación viaja en la respuesta HTTP (solo mientras NODE_ENV != production)');
}

// ---- Resumen -----------------------------------------------------------------
seccion('RESUMEN');
const faltan = ENDPOINTS.filter((e) => !cubiertos.has(e));
console.log(`  Pruebas: ${pasaron + fallaron}  |  PASS: ${pasaron}  |  FAIL: ${fallaron}`);
console.log(`  Endpoints ejercitados: ${ENDPOINTS.length - faltan.length}/${ENDPOINTS.length}` + (faltan.length ? `  (sin cubrir: ${faltan.join(', ')})` : ''));
console.log(`  Hallazgos confirmados: ${hallazgos.filter((h) => h.reproduce).length}/${hallazgos.length}`);
if (fallas.length) { console.log('\n  Pruebas fallidas:'); fallas.forEach((f) => console.log('   - ' + f)); }
process.exit(fallaron ? 1 : 0);
