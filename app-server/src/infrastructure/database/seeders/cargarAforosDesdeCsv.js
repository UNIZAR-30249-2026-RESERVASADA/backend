const fs = require("fs");
const path = require("path");

async function cargarAforosDesdeCsv({ Espacio }) {
  console.log("⮕ Ejecutando seeder cargarAforosDesdeCsv");

  const rutaBase = "/data/espacios_geojson";
  const rutaCsv = path.join(rutaBase, "TB_ESPACIOS.csv");

  if (!fs.existsSync(rutaCsv)) {
    console.warn(`  · No se encontró el CSV de aforos en: ${rutaCsv}`);
    return;
  }

  const contenido = fs.readFileSync(rutaCsv, "utf8");

  const lineas = contenido
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length === 0) {
    console.warn("  · CSV de aforos vacío");
    return;
  }

  // 1) Cabecera
  const cabecera = lineas[0]
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim());
  console.log("  · Cabecera CSV:", cabecera);

  const idxIdEspacio = cabecera.findIndex(
    (c) => c.toUpperCase() === "ID_ESPACIO"
  );
  const idxPlazas = cabecera.findIndex(
    (c) => c.toUpperCase() === "NMRO_PLAZAS"
  );

  if (idxIdEspacio === -1 || idxPlazas === -1) {
    console.warn(
      "  · No se encontraron columnas ID_ESPACIO / NMRO_PLAZAS en el CSV"
    );
    return;
  }

  const mapaAforos = new Map(); // id_espacio -> aforo

  // 2) Filas
  for (let i = 1; i < lineas.length; i++) {
    const cols = lineas[i].split(",");

    if (cols.length <= Math.max(idxIdEspacio, idxPlazas)) continue;

    const rawId = cols[idxIdEspacio].trim();
    const rawPlazas = cols[idxPlazas].trim();

    // quitar comillas
    const idEspacio = rawId.replace(/^"|"$/g, "");
    const plazasRaw = rawPlazas.replace(/^"|"$/g, "");

    if (!idEspacio) continue;

    const aforo = parseInt(plazasRaw, 10);
    if (Number.isNaN(aforo)) continue;

    mapaAforos.set(idEspacio, aforo);
  }

  console.log(
    `  · Registros de aforo leídos del CSV: ${mapaAforos.size}`
  );

  // 3) Actualizar aforo de los espacios que están en el CSV
  let actualizadosCsv = 0;
  for (const [idEspacio, aforo] of mapaAforos.entries()) {
    const [n] = await Espacio.update(
      { aforo },
      { where: { id_espacio: idEspacio } }
    );
    if (n === 0) {
      // Para depurar, puedes loguear algunos que no encuentra
      // console.log("No se encontró espacio con id_espacio =", idEspacio);
    }
    actualizadosCsv += n;
  }
  console.log(`  · Espacios con aforo desde CSV actualizados: ${actualizadosCsv}`);

  // 4) Poner aforo por defecto (70) a los que sigan con null
  const [nPorDefecto] = await Espacio.update(
    { aforo: 70 },
    {
      where: {
        aforo: null,
      },
    }
  );
  console.log(`  · Espacios con aforo por defecto (70): ${nPorDefecto}`);

  console.log("✓ Aforos actualizados desde CSV");
}

module.exports = cargarAforosDesdeCsv;