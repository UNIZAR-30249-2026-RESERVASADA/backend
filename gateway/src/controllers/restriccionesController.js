const appServerClient = require("../services/appServerClient");

async function obtenerRestricciones(req, res, next) {
  try {
    const { rol } = req.params;

    if (!rol) {
      return res.status(400).json({ message: "Rol es obligatorio" });
    }

    const restricciones = await appServerClient.obtenerRestricciones(rol);

    res.status(200).json(restricciones);
  } catch (err) {
    next(err);
  }
}

module.exports = { obtenerRestricciones };
