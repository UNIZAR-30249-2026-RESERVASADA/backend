const appServerClient = require("../services/appServerClient");
const { signToken } = require("../services/jwtService");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const usuario = await appServerClient.login(email, password);
    const token = signToken(usuario);

    return res.status(200).json({ token, usuario });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };