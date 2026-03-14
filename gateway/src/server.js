const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.GATEWAY_PORT || 3000;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gateway" });
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});