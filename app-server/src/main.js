const express = require("express");

const { conectar, Espacio, Reserva, Usuario } = require("./infrastructure/database");

const SequelizeEspacioRepository = require("./infrastructure/repositories/SequelizeEspacioRepository");
const SequelizeReservaRepository = require("./infrastructure/repositories/SequelizeReservaRepository");
const SequelizeUsuarioRepository = require("./infrastructure/repositories/SequelizeUsuarioRepository");

const GetEspaciosMetadatosUseCase = require("./application/uses-cases/GetEspaciosMetadatosUseCase");
const ReservarEspacioUseCase = require("./application/uses-cases/ReservarEspacioUseCase");
const LoginUseCase = require("./application/uses-cases/LoginUseCase");
const ObtenerRestriccionesUseCase = require("./application/uses-cases/ObtenerRestriccionesUseCase");

const ReservaEntity = require("./domain/entities/Reserva");
const EspacioEntity = require("./domain/entities/Espacio");
const ReservaPolicy = require("./domain/policies/ReservaPolicy");

const reservasRoutes = require("./http/reservasRoutes");
const espaciosRoutes = require("./http/espaciosRoutes");
const authRoutes = require("./http/authRoutes");

const PORT = process.env.APP_SERVER_PORT || 4000;

async function main() {
  await conectar();
  const espacioRepository = new SequelizeEspacioRepository({
    EspacioModel: Espacio,
  });

  const reservaRepository = new SequelizeReservaRepository({
    ReservaModel: Reserva,
  });

  const usuarioRepository = new SequelizeUsuarioRepository(Usuario);
  const getEspaciosMetadatosUseCase = new GetEspaciosMetadatosUseCase({
    espacioRepository,
  });
  const reservarEspacioUseCase = new ReservarEspacioUseCase({
    espacioRepository,
    reservaRepository,
    ReservaEntity,
    usuarioRepository,
    ReservaPolicy,
  });
  const loginUseCase = new LoginUseCase({
    usuarioRepository,
  });

  const obtenerRestriccionesUseCase = new ObtenerRestriccionesUseCase();

  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({ ok: true, service: "app-server" });
  });  // Registrar rutas
  espaciosRoutes({ getEspaciosMetadatosUseCase })(app);
  reservasRoutes({ reservarEspacioUseCase })(app);
  authRoutes({ loginUseCase, obtenerRestriccionesUseCase })(app);

  app.listen(PORT, () => {
    console.log(`App-server running on port ${PORT}`);
  });
}

main().catch(console.error);