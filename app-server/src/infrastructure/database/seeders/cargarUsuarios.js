const bcrypt = require("bcryptjs");

async function cargarUsuarios({ Usuario, Departamento }) {
  // buscamos ids reales de los 2 departamentos fijos
  const dInf = await Departamento.findOne({
    where: { nombre: "Informática e Ingeniería de Sistemas" },
  });
  const dElec = await Departamento.findOne({
    where: { nombre: "Ingeniería Electrónica y Comunicaciones" },
  });

  const depInfId = dInf ? dInf.id : null;
  const depElecId = dElec ? dElec.id : null;

  // contraseña dummy para todos (hash de "password")
  const passwordHash = await bcrypt.hash("password", 10);

  const usuarios = [

    // Gerente SIN rol (rol null)
    {
      nombre: "Gerente Puro",
      email: "gerente.puro@eina.unizar.es",
      contrasenia: passwordHash,
      rol: null,
      esGerente: true,
      departamentoId: null,
    },

    // Gerente puro (sin departamento)
    {
      nombre: "Gerente General",
      email: "gerente@eina.unizar.es",
      contrasenia: passwordHash,
      rol: "docente_investigador",
      esGerente: true,
      departamentoId: null,
    },

    // Docente-investigador (Inf)
    {
      nombre: "Ana Docente INF",
      email: "ana.docente@unizar.es",
      contrasenia: passwordHash,
      rol: "docente_investigador",
      esGerente: false,
      departamentoId: depInfId,
    },

    // Docente-investigador (Elec)
    {
      nombre: "Luis Docente ELEC",
      email: "luis.docente@unizar.es",
      contrasenia: passwordHash,
      rol: "docente_investigador",
      esGerente: false,
      departamentoId: depElecId,
    },

    // Investigador contratado (Inf)
    {
      nombre: "Marta Investigadora INF",
      email: "marta.investigadora@unizar.es",
      contrasenia: passwordHash,
      rol: "investigador_contratado",
      esGerente: false,
      departamentoId: depInfId,
    },

    // Investigador contratado (Elec)
    {
      nombre: "Pablo Investigador ELEC",
      email: "pablo.investigador@unizar.es",
      contrasenia: passwordHash,
      rol: "investigador_contratado",
      esGerente: false,
      departamentoId: depElecId,
    },

    // Técnico de laboratorio (Inf)
    {
      nombre: "Laura Técnico INF",
      email: "laura.tecnico@unizar.es",
      contrasenia: passwordHash,
      rol: "tecnico_laboratorio",
      esGerente: false,
      departamentoId: depInfId,
    },

    // Técnico de laboratorio (Elec)
    {
      nombre: "Carlos Técnico ELEC",
      email: "carlos.tecnico@unizar.es",
      contrasenia: passwordHash,
      rol: "tecnico_laboratorio",
      esGerente: false,
      departamentoId: depElecId,
    },

    // Conserje (sin departamento)
    {
      nombre: "Conserje Ada Byron",
      email: "conserje@unizar.es",
      contrasenia: passwordHash,
      rol: "conserje",
      esGerente: false,
      departamentoId: null,
    },

    // Estudiantes (varios)
    {
      nombre: "Estudiante 1",
      email: "estudiante1@unizar.es",
      contrasenia: passwordHash,
      rol: "estudiante",
      esGerente: false,
      departamentoId: null,
    },
    {
      nombre: "Estudiante 2",
      email: "estudiante2@unizar.es",
      contrasenia: passwordHash,
      rol: "estudiante",
      esGerente: false,
      departamentoId: null,
    },

    // Investigador visitante (Inf)
    {
      nombre: "Visiting INF",
      email: "visiting.inf@unizar.es",
      contrasenia: passwordHash,
      rol: "investigador_visitante",
      esGerente: false,
      departamentoId: depInfId,
    },

    // Investigador visitante (Elec)
    {
      nombre: "Visiting ELEC",
      email: "visiting.elec@unizar.es",
      contrasenia: passwordHash,
      rol: "investigador_visitante",
      esGerente: false,
      departamentoId: depElecId,
    },
  ];

  for (const u of usuarios) {
    const existe = await Usuario.findOne({ where: { email: u.email } });
    if (!existe) {
      await Usuario.create(u);
    }
  }
}

module.exports = cargarUsuarios;
// ...existing code...