const { getChannel } = require("./rabbitmq");

async function startRequestConsumer({
  reservarEspacio,
  getEspaciosMetadatos,
  login,
  obtenerReservasUsuario,
  cancelarReservaPropia,
  obtenerReservasVivas,
  eliminarReserva,
  modificarEspacio,
  modificarEdificio,
  getNotificaciones,
  marcarNotificacionesLeidas,
  crearUsuario,
  modificarUsuario,
  obtenerUsuario,
}) {
  const channel      = await getChannel();
  const requestQueue = process.env.REQUEST_QUEUE || "reservas.requests";

  await channel.assertQueue(requestQueue, { durable: true });

  channel.consume(requestQueue, async (msg) => {
    if (!msg) return;

    const replyTo       = msg.properties.replyTo;
    const correlationId = msg.properties.correlationId;
    let response;

    try {
      const { action, payload } = JSON.parse(msg.content.toString());

      if (action === "login") {
        const { email, password } = payload;
        if (!email || !password) throw new Error("Email y password son obligatorios");
        const usuario = await login.execute({ email, password });
        response = { ok: true, data: usuario };
      }

      else if (action === "obtenerMetadatosEspacios") {
        const data = await getEspaciosMetadatos.execute();
        response = { ok: true, data };
      }

      else if (action === "crearReserva") {
        const resultado = await reservarEspacio.execute(payload);
        response = { ok: true, data: resultado };
      }

      else if (action === "obtenerReservasUsuario") {
        const data = await obtenerReservasUsuario.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "cancelarReservaPropia") {
        const data = await cancelarReservaPropia.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "obtenerReservasVivas") {
        const data = await obtenerReservasVivas.execute();
        response = { ok: true, data };
      }

      else if (action === "eliminarReserva") {
        const data = await eliminarReserva.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "modificarEspacio") {
        const data = await modificarEspacio.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "modificarEdificio") {
        const data = await modificarEdificio.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "getNotificaciones") {
        const data = await getNotificaciones.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "marcarNotificacionesLeidas") {
        const data = await marcarNotificacionesLeidas.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "crearUsuario") {
        const data = await crearUsuario.execute(payload);
        response = { ok: true, data };
      }

      else if (action === "modificarUsuario") {
        const data = await modificarUsuario.execute(payload);
        response = { ok: true, data };
      } 

      else if (action === "obtenerUsuario") {
        const data = await obtenerUsuario.execute(payload);
        response = { ok: true, data };
      }

      else {
        response = { ok: false, message: `Acción no soportada: ${action}` };
      }

    } catch (error) {
      response = {
        ok:         false,
        statusCode: error.statusCode || 500,
        message:    error.message || "Error procesando mensaje",
      };
    }

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

module.exports = { startRequestConsumer };