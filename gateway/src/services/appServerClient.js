const messagingClient = require("./appServerMessagingClient");

module.exports = {
  crearReserva: messagingClient.crearReserva,
  obtenerMetadatosEspacios: messagingClient.obtenerMetadatosEspacios,
  login: messagingClient.login,
};