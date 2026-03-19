const express = require("express");
const reservaController = require("../controllers/reservasController");
const validateDto = require("../middlewares/validateDto");
const { validateCreateReservaDto } = require("../dtos/createReservaDto");

const router = express.Router();

/**
 * @swagger
 * /api/reservas:
 *   post:
 *     summary: Crear una nueva reserva
 *     description: Crea una reserva para un espacio específico en una fecha y hora determinada
 *     tags:
 *       - Reservas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - espacioId
 *               - usuarioId
 *               - fecha
 *               - horaInicio
 *               - duracion
 *             properties:
 *               espacioId:
 *                 type: integer
 *                 example: 5308
 *               usuarioId:
 *                 type: integer
 *                 example: 1
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-19"
 *               horaInicio:
 *                 type: string
 *                 format: time
 *                 example: "12:20"
 *               duracion:
 *                 type: integer
 *                 example: 1
 *               numPersonas:
 *                 type: integer
 *                 nullable: true
 *                 example: 14
 *               tipoUso:
 *                 type: string
 *                 nullable: true
 *                 example: "docencia"
 *               descripcion:
 *                 type: string
 *                 nullable: true
 *                 example: "Clase de algoritmia"
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: El espacio no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/reservas",
  validateDto(validateCreateReservaDto),
  reservaController.crearReserva
);

module.exports = router;