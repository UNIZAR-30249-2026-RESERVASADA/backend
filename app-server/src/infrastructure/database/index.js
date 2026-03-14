const { Sequelize } = require('sequelize');
const EspacioModel = require('./models/Espacio');
const cargarEspacios = require('./seeders/cargarEspacios');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    retry: {
      max: 5,
      timeout: 3000
    }
  }
);

const Espacio = EspacioModel(sequelize);

async function conectar() {
  let intentos = 0;
  const maxIntentos = 10;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  while (intentos < maxIntentos) {
    try {
      await sequelize.authenticate();
      console.log('✓ Conectado a PostgreSQL');
      break;
    } catch (err) {
      intentos++;
      console.log(`Intento ${intentos}/${maxIntentos}: Conectando a postgres...`);
      if (intentos === maxIntentos) throw err;
      await delay(2000);
    }
  }

  await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
  await sequelize.sync({ alter: true });
  console.log('✓ Tablas sincronizadas');

  await cargarEspacios(sequelize);
}

module.exports = { sequelize, Espacio, conectar };