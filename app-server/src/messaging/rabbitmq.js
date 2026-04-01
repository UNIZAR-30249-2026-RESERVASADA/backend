const amqp = require("amqplib");

let connection = null;
let channel = null;

async function connectRabbitMQ() {
  if (channel) {
    return { connection, channel };
  }

  const url = process.env.RABBITMQ_URL;
  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  return { connection, channel };
}

async function getChannel() {
  if (!channel) {
    await connectRabbitMQ();
  }

  return channel;
}

module.exports = {
  connectRabbitMQ,
  getChannel,
};