const appServerClient = require("../services/appServerClient");

async function crearReserva(req, res, next) {
  try {
    const payload = {
      ...req.validatedBody,
      usuarioId: req.user.id,
    };
    const resultado = await appServerClient.crearReserva(payload);
    return res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function getMisReservas(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const reservas  = await appServerClient.obtenerReservasUsuario(usuarioId);
    return res.status(200).json(reservas);
  } catch (error) {
    next(error);
  }
}

async function cancelarReserva(req, res, next) {
  try {
    const reservaId = req.params.id;
    const usuarioId = req.user.id;
    const resultado = await appServerClient.cancelarReservaPropia(reservaId, usuarioId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearReserva,
  getMisReservas,
  cancelarReserva,
};