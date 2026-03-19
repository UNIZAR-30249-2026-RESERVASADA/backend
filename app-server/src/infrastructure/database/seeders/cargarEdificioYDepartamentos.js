async function cargarEdificioYDepartamentos({ Edificio, Departamento }) {
  // Evitar duplicados si ya existen
  const existe = await Edificio.findOne({ where: { id_edificio: "CRE.1200" } });
  if (!existe) {
    await Edificio.create({
      id_edificio: "CRE.1200",
      nombre: "ADA BYRON",
      direccion: "C/Maria de Luna, s/n",
      campus: "Campus Río Ebro",
      horarioApertura: "08:00",
      horarioCierre: "20:00",
      porcentajeOcupacion: null, // ya lo calcularás más adelante
    });
  }

  // Departamentos fijos
  const departamentos = [
    { nombre: "Informática e Ingeniería de Sistemas" },
    { nombre: "Ingeniería Electrónica y Comunicaciones" },
  ];

  for (const dept of departamentos) {
    const ya = await Departamento.findOne({ where: { nombre: dept.nombre } });
    if (!ya) {
      await Departamento.create(dept);
    }
  }
}

module.exports = cargarEdificioYDepartamentos;