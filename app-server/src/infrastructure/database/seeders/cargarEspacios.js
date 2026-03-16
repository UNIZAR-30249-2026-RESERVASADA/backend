const fs = require('fs');
const path = require('path');

async function cargarEspacios(sequelize) {
  const [rows] = await sequelize.query('SELECT COUNT(*) as count FROM espacios');
  if (parseInt(rows[0].count) > 0) {
    console.log('Espacios ya cargados, omitiendo...');
    return;
  }

  const dir = '/data/espacios_geojson';
  if (!fs.existsSync(dir)) {
    console.warn('No se encontró el directorio de GeoJSON');
    return;
  }

  const archivos = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  let insertados = 0;

  for (const archivo of archivos) {
    const geojson = JSON.parse(fs.readFileSync(path.join(dir, archivo)));

    for (const feature of geojson.features) {
      const props = feature.properties;
      if (!props?.EDIFICIO?.toUpperCase().includes('ADA BYRON')) continue;
      if (!feature.geometry?.coordinates) continue;

      try {
        await sequelize.query(`
          INSERT INTO espacios (gid, id_espacio, nombre, uso, categoria, edificio, planta, superficie, reservable, aforo, geom)
          VALUES (:gid, :id_espacio, :nombre, :uso, :categoria, :edificio, :planta, :superficie, false, :aforo,
                  ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326))
          ON CONFLICT (gid) DO NOTHING
        `, {
          replacements: {
            gid: feature.id,
            id_espacio: props.ID_ESPACIO || null,
            nombre: props.Nombre || props.NOMBRE || null,
            uso: props.USO || null,
            categoria: props.USO || null,  // INICIALMENTE IGUAL A USO
            edificio: props.EDIFICIO || null,
            planta: props.Altura || props.PLANTA || null,
            superficie: props.SUPERFICIE || null,
            aforo: null,
            geom: JSON.stringify(feature.geometry)
          }
        });
        insertados++;
      } catch (err) {
        console.error(`Error en feature ${feature.id}:`, err.message);
      }
    }
  }

  console.log(`✓ Espacios Ada Byron cargados: ${insertados}`);
}

module.exports = cargarEspacios;