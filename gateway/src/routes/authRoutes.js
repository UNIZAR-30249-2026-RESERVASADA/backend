const express = require("express");
const authController = require("../controllers/authController");
const validateDto = require("../middlewares/validateDto");
const { validateLoginDto } = require("../dtos/loginDto");

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuario
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@unizar.es"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 email:
 *                   type: string
 *                 rol:
 *                   type: string
 *                   enum: ["estudiante", "investigador_contratado", "docente_investigador", "conserje", "tecnico_laboratorio", "gerente"]
 *       400:
 *         description: Email no proporcionado
 *       404:
 *         description: Usuario no encontrado
 */
router.post("/auth/login", validateDto(validateLoginDto), authController.login);

module.exports = router;
