const http = require("http");
const { conectar } = require("./infrastructure/database");

const PORT = process.env.APP_SERVER_PORT || 4000;

async function main() {
  await conectar();

  http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "app-server" }));
  }).listen(PORT, () => {
    console.log(`App-server running on port ${PORT}`);
  });
}

main().catch(console.error);