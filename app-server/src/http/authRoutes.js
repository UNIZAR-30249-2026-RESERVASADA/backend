const express = require("express");

module.exports = ({ loginUseCase, obtenerRestriccionesUseCase }) => (app) => {  app.post("/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email y password son obligatorios" });
      }

      const usuario = await loginUseCase.execute({ email, password });

      res.status(200).json(usuario);
    } catch (err) {
      next(err);
    }
  });

  // ← NUEVO: endpoint para obtener restricciones de un rol
  app.get("/auth/restricciones/:rol", async (req, res, next) => {
    try {
      const { rol } = req.params;

      const restricciones = await obtenerRestriccionesUseCase.execute({ rolUsuario: rol });

      res.status(200).json(restricciones);
    } catch (err) {
      next(err);
    }
  });
};
