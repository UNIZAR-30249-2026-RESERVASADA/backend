const express = require("express");
const espacioController = require("../controllers/espaciosController");

const router = express.Router();

/**
 * @swagger
 * /api/espacios/metadatos:
 *   get:
 *     summary: Obtener metadatos de todos los espacios
 *     description: Retorna lista de espacios con información de categoría, disponibilidad y aforo
 *     tags:
 *       - Espacios
 *     responses:
 *       200:
 *         description: Lista de metadatos de espacios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EspacioMetadatos'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/espacios/metadatos", espacioController.getMetadatosEspacios);

module.exports = router;