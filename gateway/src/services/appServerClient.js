const messagingClient = require("./appServerMessagingClient");

module.exports = {
  crearReserva:             messagingClient.crearReserva,
  obtenerMetadatosEspacios: messagingClient.obtenerMetadatosEspacios,
  login:                    messagingClient.login,
  obtenerReservasUsuario:   messagingClient.obtenerReservasUsuario,
  cancelarReservaPropia:    messagingClient.cancelarReservaPropia,
  obtenerReservasVivas:     messagingClient.obtenerReservasVivas,
  eliminarReserva:          messagingClient.eliminarReserva,
};