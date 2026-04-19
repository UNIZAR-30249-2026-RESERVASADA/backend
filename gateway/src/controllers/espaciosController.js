const appServerClient = require("../services/appServerClient");

async function getMetadatosEspacios(req, res, next) {
  try {
    const data = await appServerClient.obtenerMetadatosEspacios();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function modificarEspacio(req, res, next) {
  try {
    if (!req.user.esGerente) {
      return res.status(403).json({ message: "Solo los gerentes pueden modificar espacios" });
    }
    const espacioId = Number(req.params.id);
    const cambios   = req.body;
    const resultado = await appServerClient.modificarEspacio(espacioId, cambios, true);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMetadatosEspacios,
  modificarEspacio,
};