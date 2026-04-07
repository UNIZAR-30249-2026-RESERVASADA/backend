const amqp = require("amqplib");

let connection = null;
let channel    = null;

async function connectRabbitMQ(retries = 10, delay = 3000) {
  if (channel) return { connection, channel };

  for (let i = 0; i < retries; i++) {
    try {
      const url  = process.env.RABBITMQ_URL;
      connection = await amqp.connect(url);
      channel    = await connection.createChannel();
      console.log("Conectado a RabbitMQ");
      return { connection, channel };
    } catch (err) {
      console.log(`RabbitMQ no disponible, reintento ${i + 1}/${retries}...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw new Error("No se pudo conectar a RabbitMQ después de varios intentos");
}

async function getChannel() {
  if (!channel) await connectRabbitMQ();
  return channel;
}

module.exports = { connectRabbitMQ, getChannel };