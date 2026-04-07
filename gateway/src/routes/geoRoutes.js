const express = require("express");
const { getEspacios } = require("../controllers/geoController");

const router = express.Router();

/**
 * @swagger
 * /api/geo/espacios:
 *   get:
 *     summary: Obtener espacios geográficos del edificio Ada Byron
 *     tags: [Geo]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: GeoJSON con los espacios del edificio
 */
router.get("/geo/espacios", getEspacios);

module.exports = router;