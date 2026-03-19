const { Op } = require("sequelize");

async function asignarEdificioAEspacios({ Espacio, Edificio }) {
  console.log("⮕ Ejecutando seeder asignarEdificioAEspacios");

  // buscamos el edificio ADA BYRON en la tabla edificios
  const edificioAda = await Edificio.findOne({
    where: { nombre: "ADA BYRON" },
  });

  if (!edificioAda) {
    console.warn("  · No se encontró edificio ADA BYRON, no se asignan edificioId");
    return;
  }

  // ponemos edificioId a todos los espacios cuyo campo 'edificio' CONTIENE 'ADA BYRON'
  const [nActualizados] = await Espacio.update(
    { edificioId: edificioAda.id },
    {
      where: {
        edificio: { [Op.iLike]: "%ADA BYRON%" },
      },
    }
  );

  console.log(`  · Espacios actualizados con edificioId=${edificioAda.id}: ${nActualizados}`);
}

module.exports = asignarEdificioAEspacios;