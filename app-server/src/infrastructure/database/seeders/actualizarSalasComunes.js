const { Op } = require("sequelize");

async function actualizarSalasComunes({ Espacio }) {
  console.log("⮕ Ejecutando seeder actualizarSalasComunes");

  const patronesSalaComun = [
    "%SALA COMÚN%",
    "%SALA COMUN%",
    "%SALON DE ACTOS%",
    "%SALA DE JUNTAS%",
    "%BIBLIOTECA%",
  ];

  let total = 0;
  for (const patron of patronesSalaComun) {
    const [n] = await Espacio.update(
      {
        uso:            "SALA COMUN",
        categoria:      "sala comun",
        reservable:     true,
        asignadoAEina:  true,
        departamentoId: null,
      },
      { where: { nombre: { [Op.iLike]: patron } } }
    );
    total += n;
  }

  console.log(`  · Espacios actualizados a sala comun: ${total}`);
  console.log("✓ Salas comunes actualizadas");
}

module.exports = actualizarSalasComunes;