const appServerClient = require("../services/appServerClient");

async function crearReserva(req, res, next) {
  try {
    console.log("Controller: reservaData recibida =", req.validatedBody);
    console.log("Controller: usuario autenticado =", req.user);

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

module.exports = {
  crearReserva,
};