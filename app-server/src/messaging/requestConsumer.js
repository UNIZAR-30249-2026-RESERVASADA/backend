const { getChannel } = require("./rabbitmq");
const ReservaPolicy = require("../domain/policies/ReservaPolicy");

async function startRequestConsumer({
  reservarEspacioUseCase,
  getEspaciosMetadatosUseCase,
  loginUseCase,
}) {
  const channel = await getChannel();
  const requestQueue = process.env.REQUEST_QUEUE || "reservas.requests";

  await channel.assertQueue(requestQueue, { durable: true });

  channel.consume(requestQueue, async (msg) => {
    if (!msg) return;

    const replyTo = msg.properties.replyTo;
    const correlationId = msg.properties.correlationId;

    let response;

    try {
      const content = JSON.parse(msg.content.toString());
      const { action, payload } = content;

      // LOGIN
      if (action === "login") {
        const { email, password } = payload;

        if (!email || !password) {
          throw new Error("Email y password son obligatorios");
        }

        const usuario = await loginUseCase.execute({ email, password });

        response = { 
          ok: true, 
          data: {
            usuario,
            restriccionesReserva : ReservaPolicy.obtenerRestriccionesUI(usuario.rol)
          }
        };
      }

      // METADATOS
      else if (action === "obtenerMetadatosEspacios") {
        const data = await getEspaciosMetadatosUseCase.execute();

        response = { ok: true, data };
      }

      // RESERVA
      else if (action === "crearReserva") {
        const {
          espacioId,
          usuarioId,
          fecha,
          horaInicio,
          duracion,
          numPersonas,
          tipoUso,
          descripcion,
        } = payload;

        console.log("App-server recibió (broker):", payload);

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

        response = { ok: true, data: resultado };
      }

      // acción desconocida
      else {
        response = {
          ok: false,
          message: `Acción no soportada: ${action}`,
        };
      }
    } catch (error) {
      response = {
        ok: false,
        message: error.message || "Error procesando mensaje",
      };
    }

    // responder al gateway
    if (replyTo) {
      channel.sendToQueue(
        replyTo,
        Buffer.from(JSON.stringify(response)),
        { correlationId }
      );
    }

    channel.ack(msg);
  });
}

module.exports = {
  startRequestConsumer,
};