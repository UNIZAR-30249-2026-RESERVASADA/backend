const { conectar, Espacio, Reserva, ReservaEspacio, Usuario, Departamento, Edificio, UsuarioEspacio } = require("./infrastructure/database");

const { connectRabbitMQ }      = require("./messaging/rabbitmq");
const { startRequestConsumer } = require("./messaging/requestConsumer");

const SequelizeEspacioRepository      = require("./infrastructure/repositories/SequelizeEspacioRepository");
const SequelizeReservaRepository      = require("./infrastructure/repositories/SequelizeReservaRepository");
const SequelizeUsuarioRepository      = require("./infrastructure/repositories/SequelizeUsuarioRepository");
const SequelizeEdificioRepository     = require("./infrastructure/repositories/SequelizeEdificioRepository");
const SequelizeDepartamentoRepository = require("./infrastructure/repositories/SequelizeDepartamentoRepository");

const GetEspaciosMetadatos   = require("./application/use-cases/GetEspaciosMetadatos");
const ReservarEspacio        = require("./application/use-cases/ReservarEspacio");
const Login                  = require("./application/use-cases/Login");
const ObtenerReservasUsuario = require("./application/use-cases/ObtenerReservasUsuario");
const CancelarReservaPropia  = require("./application/use-cases/CancelarReservaPropia");
const ObtenerReservasVivas   = require("./application/use-cases/ObtenerReservasVivas");
const EliminarReserva        = require("./application/use-cases/EliminarReserva");
const ModificarEspacio       = require("./application/use-cases/ModificarEspacio");
const ModificarEdificio      = require("./application/use-cases/ModificarEdificio");

const ReservaPolicy  = require("./domain/policies/ReservaPolicy");
const ReservaFactory = require("./domain/factories/ReservaFactory");

async function main() {
  await conectar();
  await connectRabbitMQ();

  const espacioRepository      = new SequelizeEspacioRepository({ EspacioModel: Espacio, UsuarioEspacioModel: UsuarioEspacio, UsuarioModel: Usuario, EdificioModel: Edificio });
  const reservaRepository      = new SequelizeReservaRepository({ ReservaModel: Reserva, ReservaEspacioModel: ReservaEspacio });
  const usuarioRepository      = new SequelizeUsuarioRepository({ UsuarioModel: Usuario });
  const edificioRepository     = new SequelizeEdificioRepository({ EdificioModel: Edificio });
  const departamentoRepository = new SequelizeDepartamentoRepository({ DepartamentoModel: Departamento });

  const reservaFactory = new ReservaFactory();

  const getEspaciosMetadatos = new GetEspaciosMetadatos({ espacioRepository });

  const reservarEspacio = new ReservarEspacio({
    espacioRepository,
    reservaRepository,
    edificioRepository,
    usuarioRepository,
    departamentoRepository,
    reservaFactory,
    ReservaPolicy,
  });

  const login                  = new Login({ usuarioRepository });
  const obtenerReservasUsuario = new ObtenerReservasUsuario({ reservaRepository });
  const cancelarReservaPropia  = new CancelarReservaPropia({ reservaRepository });
  const obtenerReservasVivas   = new ObtenerReservasVivas({ reservaRepository });
  const eliminarReserva        = new EliminarReserva({ reservaRepository });
  const modificarEspacio       = new ModificarEspacio({ espacioRepository, usuarioRepository, reservaRepository });
  const modificarEdificio      = new ModificarEdificio({ edificioRepository, espacioRepository, reservaRepository, usuarioRepository });

  await startRequestConsumer({
    reservarEspacio,
    getEspaciosMetadatos,
    login,
    obtenerReservasUsuario,
    cancelarReservaPropia,
    obtenerReservasVivas,
    eliminarReserva,
    modificarEspacio,
    modificarEdificio,
  });

  console.log("App-server listo y esperando mensajes...");
}

main().catch(console.error);