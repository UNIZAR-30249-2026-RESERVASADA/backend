const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const reservaRoutes = require("./routes/reservasRoutes");
const espacioRoutes = require("./routes/espaciosRoutes");
const authRoutes = require("./routes/authRoutes");
const geoRoutes = require("./routes/geoRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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
app.use("/api", geoRoutes);

app.use(errorHandler);

module.exports = app;