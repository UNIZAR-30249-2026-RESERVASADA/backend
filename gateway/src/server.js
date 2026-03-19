const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const reservaRoutes = require("./routes/reservasRoutes");
const espacioRoutes = require("./routes/espaciosRoutes");
const authRoutes = require("./routes/authRoutes");
const restriccionesRoutes = require("./routes/restriccionesRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // origen del frontend
  })                                                                                                                    
);

app.use(express.json());

// Swagger documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api", reservaRoutes);
app.use("/api", espacioRoutes);
app.use("/api", authRoutes);
app.use("/api", restriccionesRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway escuchando en el puerto ${PORT}`);
});