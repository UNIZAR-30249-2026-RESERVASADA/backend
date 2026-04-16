const { rpcCall } = require("../messaging/rpcClient");

const REQUEST_QUEUE = process.env.REQUEST_QUEUE || "reservas.requests";

function handleResponse(response, defaultMessage) {
  if (!response.ok) {
    const error = new Error(response.message || defaultMessage);
    error.statusCode = response.statusCode || 500;
    throw error;
  }
  return response.data;
}

async function crearReserva(reservaData) {
  const response = await rpcCall(REQUEST_QUEUE, { action: "crearReserva", payload: reservaData });
  return handleResponse(response, "Error al crear la reserva");
}

async function obtenerMetadatosEspacios() {
  const response = await rpcCall(REQUEST_QUEUE, { action: "obtenerMetadatosEspacios", payload: {} });
  return handleResponse(response, "Error obteniendo metadatos de espacios");
}

async function login(email, password) {
  const response = await rpcCall(REQUEST_QUEUE, { action: "login", payload: { email, password } });
  return handleResponse(response, "Error en login");
}

async function obtenerReservasUsuario(usuarioId) {
  const response = await rpcCall(REQUEST_QUEUE, { action: "obtenerReservasUsuario", payload: { usuarioId } });
  return handleResponse(response, "Error obteniendo reservas del usuario");
}

async function cancelarReservaPropia(reservaId, usuarioId) {
  const response = await rpcCall(REQUEST_QUEUE, { action: "cancelarReservaPropia", payload: { reservaId, usuarioId } });
  return handleResponse(response, "Error cancelando la reserva");
}

async function obtenerReservasVivas() {
  const response = await rpcCall(REQUEST_QUEUE, { action: "obtenerReservasVivas", payload: {} });
  return handleResponse(response, "Error obteniendo reservas vivas");
}

async function eliminarReserva(reservaId, usuarioId, esGerente) {
  const response = await rpcCall(REQUEST_QUEUE, { action: "eliminarReserva", payload: { reservaId, usuarioId, esGerente } });
  return handleResponse(response, "Error eliminando la reserva");
}

module.exports = {
  crearReserva,
  obtenerMetadatosEspacios,
  login,
  obtenerReservasUsuario,
  cancelarReservaPropia,
  obtenerReservasVivas,
  eliminarReserva,
};