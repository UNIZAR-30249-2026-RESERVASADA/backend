const { Op } = require("sequelize");

async function actualizarSeminarios({ Espacio }) {
  console.log("⮕ Ejecutando seeder actualizarSeminarios");

  const [n] = await Espacio.update(
    {
      uso:            "SEMINARIO",
      categoria:      "seminario",
      reservable:     true,
      asignadoAEina:  true,
      departamentoId: null,
    },
    {
      where: {
        nombre: { [Op.iLike]: "SEMINARIO%" },
      },
    }
  );

  console.log(`  · Espacios actualizados a seminario: ${n}`);
  console.log("✓ Seminarios actualizados");
}

module.exports = actualizarSeminarios;