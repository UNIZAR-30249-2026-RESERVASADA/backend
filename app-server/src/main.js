const { conectar, Espacio, Reserva, Usuario } = require("./infrastructure/database");

const { connectRabbitMQ } = require("./messaging/rabbitmq");
const { startRequestConsumer } = require("./messaging/requestConsumer");

const SequelizeEspacioRepository = require("./infrastructure/repositories/SequelizeEspacioRepository");
const SequelizeReservaRepository = require("./infrastructure/repositories/SequelizeReservaRepository");
const SequelizeUsuarioRepository = require("./infrastructure/repositories/SequelizeUsuarioRepository");

const GetEspaciosMetadatosUseCase = require("./application/uses-cases/GetEspaciosMetadatosUseCase");
const ReservarEspacioUseCase = require("./application/uses-cases/ReservarEspacioUseCase");
const LoginUseCase = require("./application/uses-cases/LoginUseCase");

const ReservaEntity = require("./domain/entities/Reserva");
const ReservaPolicy = require("./domain/policies/ReservaPolicy");

async function main() {
  // 1. BD
  await conectar();

  // 2. RabbitMQ
  await connectRabbitMQ();

  // 3. Repositorios
  const espacioRepository = new SequelizeEspacioRepository({
    EspacioModel: Espacio,
  });

  const reservaRepository = new SequelizeReservaRepository({
    ReservaModel: Reserva,
  });

  const usuarioRepository = new SequelizeUsuarioRepository(Usuario);

  // 4. Use Cases
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

  // 5. Consumer 
  await startRequestConsumer({
    reservarEspacioUseCase,
    getEspaciosMetadatosUseCase,
    loginUseCase,
  });

  console.log("🚀 App-server listo (RabbitMQ + DB) y esperando mensajes...");
}

main().catch(console.error);