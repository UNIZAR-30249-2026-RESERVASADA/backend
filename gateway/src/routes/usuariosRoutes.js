const express            = require("express");
const usuariosController = require("../controllers/usuariosController");
const authMiddleware     = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario (solo gerentes)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, contrasenia]
 *             properties:
 *               nombre:        { type: string }
 *               email:         { type: string }
 *               contrasenia:   { type: string }
 *               rol:           { type: string }
 *               departamentoId: { type: integer }
 *               esGerente:     { type: boolean }
 */
router.post("/usuarios",     authMiddleware, usuariosController.crearUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   patch:
 *     summary: Modificar rol y/o departamento de un usuario (solo gerentes)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rol:           { type: string }
 *               departamentoId: { type: integer }
 */
router.patch("/usuarios/:id", authMiddleware, usuariosController.modificarUsuario);

module.exports = router;