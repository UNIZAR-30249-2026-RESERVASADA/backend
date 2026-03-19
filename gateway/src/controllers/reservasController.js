const appServerClient = require("../services/appServerClient");

async function crearReserva(req, res, next) {
  try {
    const reservaData = req.validatedBody;
    console.log("Controller: reservaData recibida =", reservaData);

    const resultado = await appServerClient.crearReserva(reservaData);

    return res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearReserva,
};