const appServerClient = require("../services/appServerClient");

async function getNotificaciones(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const data = await appServerClient.getNotificaciones(usuarioId);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function marcarTodasLeidas(req, res, next) {
  try {
    const usuarioId = req.user.id;
    await appServerClient.marcarNotificacionesLeidas(usuarioId);
    return res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { getNotificaciones, marcarTodasLeidas };