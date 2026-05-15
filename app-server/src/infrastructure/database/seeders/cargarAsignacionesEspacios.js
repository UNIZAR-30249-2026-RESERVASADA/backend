const { Op } = require("sequelize");

async function cargarAsignacionesEspacios({ Espacio, Usuario, Departamento, UsuarioEspacio }) {
  console.log("⮕ Ejecutando seeder cargarAsignacionesEspacios");

  // 1) Aulas y salas comunes -> SIEMPRE EINA
  const [nAulas] = await Espacio.update(
    { asignadoAEina: true, departamentoId: null },
    { where: { categoria: ["aula", "sala comun"] } }
  );
  console.log(`  · Aulas y salas comunes asignadas a EINA: ${nAulas}`);

  // 2) Obtener departamentos
  const dInf  = await Departamento.findOne({ where: { nombre: "Informática e Ingeniería de Sistemas" } });
  const dElec = await Departamento.findOne({ where: { nombre: "Ingeniería Electrónica y Comunicaciones" } });
  console.log("  · dInf =", dInf?.id, " dElec =", dElec?.id);

  // 3) SALA INFORMÁTICA -> departamento de Informática
  if (dInf) {
    const [nSalasInf] = await Espacio.update(
      { asignadoAEina: false, departamentoId: dInf.id },
      { where: { uso: { [Op.iLike]: "%SALA INFORMÁTICA%" } } }
    );
    console.log(`  · Espacios SALA INFORMÁTICA asignados a INF: ${nSalasInf}`);
  }

  // 4) Seminarios y laboratorios -> repartir entre EINA, INF y ELEC
  const labsYSeminarios = await Espacio.findAll({
    where: {
      categoria: ["laboratorio", "seminario"],
      uso: { [Op.notILike]: "%SALA INFORMÁTICA%" },
    },
    order: [["gid", "ASC"]],
  });
  console.log(`  · Labs/seminarios: ${labsYSeminarios.length}`);

  for (let i = 0; i < labsYSeminarios.length; i++) {
    const espacio = labsYSeminarios[i];
    if (i % 3 === 0) {
      await espacio.update({ asignadoAEina: true, departamentoId: null });
    } else if (i % 3 === 1 && dInf) {
      await espacio.update({ asignadoAEina: false, departamentoId: dInf.id });
    } else if (dElec) {
      await espacio.update({ asignadoAEina: false, departamentoId: dElec.id });
    }
  }

  // 5) Despachos — asignación determinista para cubrir todos los casos de O3 y O7
  const despachos = await Espacio.findAll({
    where: { categoria: "despacho" },
    order: [["gid", "ASC"]],
  });
  console.log(`  · Despachos totales: ${despachos.length}`);

  // Obtener usuarios para asignaciones
  const visitanteInf  = await Usuario.findOne({ where: { email: "visiting.inf@unizar.es" } });
  const visitanteElec = await Usuario.findOne({ where: { email: "visiting.elec@unizar.es" } });
  const docenteInf    = await Usuario.findOne({ where: { email: "ana.docente@unizar.es" } });
  const docenteElec   = await Usuario.findOne({ where: { email: "luis.docente@unizar.es" } });

  // Borrar asignaciones previas de despachos para evitar duplicados
  const despachosGids = despachos.map((d) => d.gid);
  if (despachosGids.length > 0) {
    await UsuarioEspacio.destroy({ where: { espacioId: despachosGids } });
  }

  for (let i = 0; i < despachos.length; i++) {
    const despacho = despachos[i];
    const caso     = i % 5;

    switch (caso) {
      // CASO O3 — asignado a departamento INF
      case 0:
        if (dInf) {
          await despacho.update({ asignadoAEina: false, departamentoId: dInf.id });
          console.log(`    · [O3-INF] Despacho ${despacho.id_espacio || despacho.gid} → dpto INF`);
        }
        break;

      // CASO O3 — asignado a departamento ELEC
      case 1:
        if (dElec) {
          await despacho.update({ asignadoAEina: false, departamentoId: dElec.id });
          console.log(`    · [O3-ELEC] Despacho ${despacho.id_espacio || despacho.gid} → dpto ELEC`);
        }
        break;

      // CASO O7 — asignado a investigador visitante INF
      case 2:
      if (visitanteInf) {
        await despacho.update({ asignadoAEina: false, departamentoId: null });
        await UsuarioEspacio.findOrCreate({
          where: { usuarioId: visitanteInf.id, espacioId: despacho.gid },
        });
        console.log(`    · [O7-INF] Despacho ${despacho.id_espacio || despacho.gid} → visitante INF`);
      }
      break;

      // CASO O7 — asignado a investigador visitante ELEC
      case 3:
      if (visitanteElec) {
        await despacho.update({ asignadoAEina: false, departamentoId: null });
        await UsuarioEspacio.findOrCreate({
          where: { usuarioId: visitanteElec.id, espacioId: despacho.gid },
        });
        console.log(`    · [O7-ELEC] Despacho ${despacho.id_espacio || despacho.gid} → visitante ELEC`);
      }
      break;

      // CASO bloqueado — asignado a docente (no visitante, no reservable por nadie)
      case 4:
        if (docenteInf) {
          await despacho.update({ asignadoAEina: false, departamentoId: null, reservable: false }); // ← añadir reservable: false
          await UsuarioEspacio.findOrCreate({
            where: { usuarioId: docenteInf.id, espacioId: despacho.gid },
          });
          console.log(`    · [BLOQ] Despacho ${despacho.id_espacio || despacho.gid} → docente INF (no reservable)`);
        }
        break;
          }
  }

  console.log("✓ Asignaciones de espacios creadas con todos los casos de prueba");
}

module.exports = cargarAsignacionesEspacios;