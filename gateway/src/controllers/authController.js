const appServerClient = require("../services/appServerClient");
const { signToken } = require("../services/jwtService");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const loginResult = await appServerClient.login(email, password);
    const { usuario, restriccionesReserva } = loginResult;

    const token = signToken(usuario);

    return res.status(200).json({
      token,
      usuario,
      restriccionesReserva,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
};