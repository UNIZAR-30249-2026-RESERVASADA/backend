const messagingClient = require("./appServerMessagingClient");

module.exports = {
  modificarEdificio:    messagingClient.modificarEdificio,
  modificarEspacio:           messagingClient.modificarEspacio,
  crearReserva:             messagingClient.crearReserva,
  obtenerMetadatosEspacios: messagingClient.obtenerMetadatosEspacios,
  login:                    messagingClient.login,
  obtenerReservasUsuario:   messagingClient.obtenerReservasUsuario,
  cancelarReservaPropia:    messagingClient.cancelarReservaPropia,
  obtenerReservasVivas:     messagingClient.obtenerReservasVivas,
  eliminarReserva:          messagingClient.eliminarReserva,
};