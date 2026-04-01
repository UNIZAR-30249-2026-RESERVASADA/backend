const crypto = require("crypto");
const { getChannel } = require("./rabbitmq");

async function rpcCall(queueName, message) {
  const channel = await getChannel();

  await channel.assertQueue(queueName, { durable: true });

  const { queue: replyQueue } = await channel.assertQueue("", {
    exclusive: true,
  });

  const correlationId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout esperando respuesta del app-server"));
    }, 10000);

    channel.consume(
      replyQueue,
      (msg) => {
        if (!msg) return;

        if (msg.properties.correlationId === correlationId) {
          clearTimeout(timeout);

          try {
            const content = JSON.parse(msg.content.toString());
            resolve(content);
          } catch (error) {
            reject(error);
          }
        }
      },
      { noAck: true }
    );

    channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message)),
      {
        correlationId,
        replyTo: replyQueue,
        persistent: true,
      }
    );
  });
}

module.exports = {
  rpcCall,
};