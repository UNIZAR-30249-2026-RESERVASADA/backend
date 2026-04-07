const { conectar, Espacio, Reserva, Usuario } = require("./infrastructure/database");

const { connectRabbitMQ }    = require("./messaging/rabbitmq");
const { startRequestConsumer } = require("./messaging/requestConsumer");

const SequelizeEspacioRepository = require("./infrastructure/repositories/SequelizeEspacioRepository");
const SequelizeReservaRepository = require("./infrastructure/repositories/SequelizeReservaRepository");
const SequelizeUsuarioRepository = require("./infrastructure/repositories/SequelizeUsuarioRepository");

const GetEspaciosMetadatos   = require("./application/use-cases/GetEspaciosMetadatos");
const ReservarEspacio        = require("./application/use-cases/ReservarEspacio");
const Login                  = require("./application/use-cases/Login");
const ObtenerReservasUsuario = require("./application/use-cases/ObtenerReservasUsuario");
const CancelarReservaPropia  = require("./application/use-cases/CancelarReservaPropia");

const ReservaEntity = require("./domain/entities/Reserva");
const ReservaPolicy = require("./domain/policies/ReservaPolicy");

async function main() {
  // 1. BD
  await conectar();

  // 2. RabbitMQ
  await connectRabbitMQ();

  // 3. Repositorios
  const espacioRepository  = new SequelizeEspacioRepository({ EspacioModel: Espacio });
  const reservaRepository  = new SequelizeReservaRepository({ ReservaModel: Reserva });
  const usuarioRepository  = new SequelizeUsuarioRepository({ UsuarioModel: Usuario });

  // 4. Casos de uso
  const getEspaciosMetadatos = new GetEspaciosMetadatos({ espacioRepository });

  const reservarEspacio = new ReservarEspacio({
    espacioRepository,
    reservaRepository,
    ReservaEntity,
    usuarioRepository,
    ReservaPolicy,
  });

  const login = new Login({ usuarioRepository });

  const obtenerReservasUsuario = new ObtenerReservasUsuario({ reservaRepository });
  const cancelarReservaPropia  = new CancelarReservaPropia({ reservaRepository });

  // 5. Consumer — recibe mensajes del broker y los despacha al caso de uso correcto
  await startRequestConsumer({
    reservarEspacio,
    getEspaciosMetadatos,
    login,
    obtenerReservasUsuario,
    cancelarReservaPropia,
  });

  console.log("App-server listo y esperando mensajes...");
}

main().catch(console.error);