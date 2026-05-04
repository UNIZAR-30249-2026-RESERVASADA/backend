const appServerClient = require("../services/appServerClient");

async function crearUsuario(req, res, next) {
  try {
    if (!req.user.esGerente || req.user.esGerente === "false") {
      return res.status(403).json({ message: "Solo los gerentes pueden crear usuarios" });
    }
    const { esGerente: esGerenteNuevo, ...restoBody } = req.body;
    const resultado = await appServerClient.crearUsuario({
      ...restoBody,
      nuevoEsGerente: esGerenteNuevo || false,
      esGerente:      true,
    });
    return res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function modificarUsuario(req, res, next) {
  try {
    if (!req.user.esGerente || req.user.esGerente === "false") {
      return res.status(403).json({ message: "Solo los gerentes pueden modificar usuarios" });
    }
    const usuarioId = Number(req.params.id);
    const resultado = await appServerClient.modificarUsuario(usuarioId, req.body, true);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = { crearUsuario, modificarUsuario };