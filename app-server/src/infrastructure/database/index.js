const { Sequelize } = require('sequelize');
const EspacioModel = require('./models/Espacio');
const ReservaModel = require('./models/Reserva');
const UsuarioModel = require('./models/Usuario');
const DepartamentoModel = require('./models/Departamento');
const EdificioModel = require('./models/Edificio');
const UsuarioEspacioModel = require('./models/UsuarioEspacio');

const cargarEspacios = require('./seeders/cargarEspacios');
const cargarEdificioYDepartamentos = require('./seeders/cargarEdificioYDepartamentos');
const cargarUsuarios = require('./seeders/cargarUsuarios');
const cargarAsignacionesEspacios = require('./seeders/cargarAsignacionesEspacios');
const asignarEdificioAEspacios = require('./seeders/asignarEdificioAEspacios');
const cargarAforosDesdeCsv = require('./seeders/cargarAforosDesdeCsv');

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
const Reserva = ReservaModel(sequelize);
const Usuario = UsuarioModel(sequelize);
const Departamento = DepartamentoModel(sequelize);
const Edificio = EdificioModel(sequelize);
const UsuarioEspacio = UsuarioEspacioModel(sequelize);

// Asociaciones según tu E/R

// Usuario (0,N) ---- (1,1) Reserva
Usuario.hasMany(Reserva, { foreignKey: "usuarioId" });
Reserva.belongsTo(Usuario, { foreignKey: "usuarioId" });

// Reserva (1,1) ---- (0,N) Espacio  (simplificamos como Reserva pertenece a 1 Espacio)
Espacio.hasMany(Reserva, { foreignKey: "espacioId" });
Reserva.belongsTo(Espacio, { foreignKey: "espacioId" });

// Espacio (0,1) ---- (1,N) Departamento
Departamento.hasMany(Espacio, { foreignKey: "departamentoId" });
Espacio.belongsTo(Departamento, { foreignKey: "departamentoId" });

// Edificio (1,N) ---- (1,1) Espacio (cada espacio está en un edificio)
Edificio.hasMany(Espacio, { foreignKey: "edificioId" });
Espacio.belongsTo(Edificio, { foreignKey: "edificioId" });

// Usuario (0,N) ---- (1,N) Departamento  (Adsrito)
// simplificamos como: cada usuario pertenece a 1 departamento
Departamento.hasMany(Usuario, { foreignKey: "departamentoId" });
Usuario.belongsTo(Departamento, { foreignKey: "departamentoId" });

// Usuario (0,N) ---- (0,N) Espacio  (Asignado)
// muchos-a-muchos vía tabla intermedia usuarios_espacios
Usuario.belongsToMany(Espacio, {
  through: UsuarioEspacio,
  foreignKey: "usuarioId",
  otherKey: "espacioId",
});
Espacio.belongsToMany(Usuario, {
  through: UsuarioEspacio,
  foreignKey: "espacioId",
  otherKey: "usuarioId",
});

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
  await cargarEdificioYDepartamentos({ Edificio, Departamento });
  await cargarUsuarios({ Usuario, Departamento });
  await cargarAsignacionesEspacios({ Usuario, Espacio, Departamento, UsuarioEspacio });
  await asignarEdificioAEspacios({ Edificio, Espacio });
  await cargarAforosDesdeCsv({ Espacio });
}

module.exports = { 
  sequelize, 
  Espacio, 
  Reserva, 
  Usuario, 
  Departamento, 
  Edificio, 
  UsuarioEspacio, 
  conectar 
};