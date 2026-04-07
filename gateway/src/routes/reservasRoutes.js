const express          = require("express");
const reservaController = require("../controllers/reservasController");
const authMiddleware   = require("../middlewares/authMiddleware");
const validateDto      = require("../middlewares/validateDto");
const { validateCreateReservaDto } = require("../dtos/createReservaDto");

const router = express.Router();

/**
 * @swagger
 * /api/reservas:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reserva'
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *       400:
 *         description: Error de validación
 *       403:
 *         description: Sin permisos para reservar este espacio
 */
router.post(
  "/reservas",
  authMiddleware,
  validateDto(validateCreateReservaDto),
  reservaController.crearReserva
);

/**
 * @swagger
 * /api/reservas/mis-reservas:
 *   get:
 *     summary: Obtener las reservas del usuario autenticado
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reservas del usuario
 */
router.get(
  "/reservas/mis-reservas",
  authMiddleware,
  reservaController.getMisReservas
);

/**
 * @swagger
 * /api/reservas/{id}:
 *   delete:
 *     summary: Cancelar una reserva propia
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       403:
 *         description: No tienes permiso para cancelar esta reserva
 *       404:
 *         description: Reserva no encontrada
 */
router.delete(
  "/reservas/:id",
  authMiddleware,
  reservaController.cancelarReserva
);

module.exports = router;