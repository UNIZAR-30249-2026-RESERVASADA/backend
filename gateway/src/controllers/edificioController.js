const appServerClient = require("../services/appServerClient");

async function modificarEdificio(req, res, next) {
  try {
    if (!req.user.esGerente || req.user.esGerente === "false") {
      return res.status(403).json({ message: "Solo los gerentes pueden modificar el edificio" });
    }
    const edificioId  = Number(req.params.id);
    const cambios     = req.body;
    const afectarTodos = req.query.afectarTodos === "true";
    const resultado   = await appServerClient.modificarEdificio(edificioId, cambios, afectarTodos, true);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = { modificarEdificio };