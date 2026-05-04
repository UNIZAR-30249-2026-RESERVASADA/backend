const express           = require("express");
const espacioController = require("../controllers/espaciosController");
const authMiddleware    = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/espacios/metadatos:
 *   get:
 *     summary: Obtener metadatos de todos los espacios
 *     tags: [Espacios]
 *     responses:
 *       200:
 *         description: Lista de metadatos de espacios
 */
router.get(
  "/espacios/metadatos",
  espacioController.getMetadatosEspacios
);

/**
 * @swagger
 * /api/espacios/{id}:
 *   patch:
 *     summary: Modificar un espacio (solo gerentes)
 *     tags: [Espacios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservable:
 *                 type: boolean
 *               categoria:
 *                 type: string
 *               aforo:
 *                 type: integer
 *               departamentoId:
 *                 type: integer
 *               asignadoAEina:
 *                 type: boolean
 *               usuariosAsignados:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Espacio modificado correctamente
 *       403:
 *         description: Solo los gerentes pueden modificar espacios
 *       404:
 *         description: Espacio no encontrado
 */
router.patch(
  "/espacios/:id",
  authMiddleware,
  espacioController.modificarEspacio
);

module.exports = router;