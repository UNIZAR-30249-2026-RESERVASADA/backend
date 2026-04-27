const express            = require("express");
const edificioController = require("../controllers/edificioController");
const authMiddleware     = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/edificio/{id}:
 *   patch:
 *     summary: Modificar el edificio (solo gerentes)
 *     tags: [Edificio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: afectarTodos
 *         schema:
 *           type: boolean
 *         description: Si true, aplica el porcentaje a todos los espacios aunque tengan uno propio
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horarioApertura:
 *                 type: string
 *               horarioCierre:
 *                 type: string
 *               porcentajeOcupacion:
 *                 type: number
 *     responses:
 *       200:
 *         description: Edificio modificado
 *       403:
 *         description: Solo gerentes
 */
router.patch("/edificio/:id", authMiddleware, edificioController.modificarEdificio);

module.exports = router;