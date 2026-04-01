const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway escuchando en el puerto ${PORT}`);
});