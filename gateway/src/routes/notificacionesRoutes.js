const express                  = require("express");
const notificacionesController = require("../controllers/notificacionesController");
const authMiddleware           = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/notificaciones",         authMiddleware, notificacionesController.getNotificaciones);
router.patch("/notificaciones/leidas", authMiddleware, notificacionesController.marcarTodasLeidas);

module.exports = router;