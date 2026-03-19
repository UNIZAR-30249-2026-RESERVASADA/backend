const httpClient = require("./appServerHttpClient");

module.exports = {
  login: httpClient.login,
  crearReserva: httpClient.crearReserva,
  obtenerMetadatosEspacios: httpClient.obtenerMetadatosEspacios,
  obtenerRestricciones: httpClient.obtenerRestricciones,
};