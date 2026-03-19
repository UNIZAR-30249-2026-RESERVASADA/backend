const express = require("express");
const { obtenerRestricciones } = require("../controllers/restriccionesController");

const router = express.Router();

/**
 * @swagger
 * /api/auth/restricciones/{rol}:
 *   get:
 *     summary: Obtener restricciones de reserva por rol
 *     tags:
 *       - Autenticación
 *     parameters:
 *       - in: path
 *         name: rol
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restricciones obtenidas
 *       404:
 *         description: Rol no encontrado
 */
router.get("/auth/restricciones/:rol", obtenerRestricciones);

module.exports = router;
