const { rpcCall } = require("../messaging/rpcClient");

const REQUEST_QUEUE = process.env.REQUEST_QUEUE || "reservas.requests";

async function crearReserva(reservaData) {
  const response = await rpcCall(REQUEST_QUEUE, {
    action: "crearReserva",
    payload: reservaData,
  });

  if (!response.ok) {
    throw new Error(response.message || "Error al crear la reserva");
  }

  return response.data;
}

async function obtenerMetadatosEspacios() {
  const response = await rpcCall(REQUEST_QUEUE, {
    action: "obtenerMetadatosEspacios",
    payload: {},
  });

  if (!response.ok) {
    throw new Error(response.message || "Error obteniendo metadatos de espacios");
  }

  return response.data;
}

async function login(email, password) {
  const response = await rpcCall(REQUEST_QUEUE, {
    action: "login",
    payload: { email, password },
  });

  if (!response.ok) {
    throw new Error(response.message || "Error en login");
  }

  return response.data;
}

module.exports = {
  crearReserva,
  obtenerMetadatosEspacios,
  login,
};