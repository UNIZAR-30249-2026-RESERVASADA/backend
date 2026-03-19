module.exports = ({ reservarEspacioUseCase }) => (app) => {
  app.post("/reservas", async (req, res) => {
    try {
      const { espacioId, usuarioId, fecha, horaInicio, duracion, numPersonas, tipoUso, descripcion } = req.body;

      console.log("App-server recibió:", req.body);

      const resultado = await reservarEspacioUseCase.execute({
        espacioId,
        usuarioId,
        fecha,
        horaInicio,
        duracion,
        numPersonas,
        tipoUso,
        descripcion,
      });

      res.status(201).json(resultado);
    } catch (error) {
      res.status(400).json({
        message: error.message || "Error procesando la reserva",
      });
    }
  });
};