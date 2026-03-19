const appServerClient = require("../services/appServerClient");

async function loginUsuario(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son obligatorios" });
    }

    const usuario = await appServerClient.login(email, password);

    res.status(200).json(usuario);
  } catch (err) {
    next(err);
  }
}

module.exports = { loginUsuario };
