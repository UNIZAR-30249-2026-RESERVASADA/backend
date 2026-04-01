const express = require("express");

module.exports = ({ loginUseCase, obtenerRestriccionesUseCase }) => (app) => {  
  
  app.post("/auth/login", async (req, res, next) => {
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
};
