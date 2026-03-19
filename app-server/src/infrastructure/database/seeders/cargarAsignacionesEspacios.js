const { Op } = require("sequelize");

async function cargarAsignacionesEspacios({ Espacio, Usuario, Departamento, UsuarioEspacio }) {
  console.log("⮕ Ejecutando seeder cargarAsignacionesEspacios");

  // 1) Aulas y salas comunes -> SIEMPRE EINA
  const [nAulas] = await Espacio.update(
    { asignadoAEina: true, departamentoId: null },
    {
      where: {
        categoria: ["Aula", "Sala común", "sala_comun", "aula"], // ajusta si tus categorías son otras
      },
    }
  );
  console.log(`  · Aulas y salas comunes asignadas a EINA: ${nAulas}`);

  // 2) Obtener departamentos
  const dInf = await Departamento.findOne({
    where: { nombre: "Informática e Ingeniería de Sistemas" },
  });
  const dElec = await Departamento.findOne({
    where: { nombre: "Ingeniería Electrónica y Comunicaciones" },
  });
  console.log("  · dInf =", dInf && dInf.id, " dElec =", dElec && dElec.id);

  // 3) SALA INFORMÁTICA -> SIEMPRE departamento de Informática
  if (dInf) {
    const [nSalasInf] = await Espacio.update(
      {
        asignadoAEina: false,
        departamentoId: dInf.id,
      },
      {
        where: {
          uso: { [Op.iLike]: "%SALA INFORMÁTICA%" },
        },
      }
    );
    console.log(`  · Espacios de uso SALA INFORMÁTICA asignados a INF: ${nSalasInf}`);
  }

  // 4) SemINARIOS y LABORATORIOS (resto) -> algunos EINA, otros departamentos al azar
  const labsYSeminarios = await Espacio.findAll({
    where: {
      categoria: ["Laboratorio", "laboratorio", "Seminario", "seminario"],
      uso: { [Op.notILike]: "%SALA INFORMÁTICA%" }, // excluimos las salas informáticas que ya tratamos
    },
    order: [["gid", "ASC"]],
  });
  console.log(`  · Labs/seminarios (no SALA INFORMÁTICA): ${labsYSeminarios.length}`);

  for (const espacio of labsYSeminarios) {
    // tiramos "moneda"
    const r = Math.random();
    if (r < 0.33) {
      // 1/3 → EINA
      await espacio.update({ asignadoAEina: true, departamentoId: null });
    } else if (r < 0.66 && dInf) {
      // 1/3 → depto INF
      await espacio.update({ asignadoAEina: false, departamentoId: dInf.id });
    } else if (dElec) {
      // 1/3 → depto ELEC
      await espacio.update({ asignadoAEina: false, departamentoId: dElec.id });
    }
  }

  // 5) DESPACHOS → algunos personas, otros departamentos

  // 5.a) Todos los despachos candidatos
  const despachos = await Espacio.findAll({
    where: {
      categoria: ["Despacho", "despacho"],
    },
    order: [["gid", "ASC"]],
  });
  console.log(`  · Despachos totales: ${despachos.length}`);

  // usuarios válidos para asignar despachos (investigador_contratado o docente_investigador)
  const usuariosAsignables = await Usuario.findAll({
    where: {
      rol: { [Op.in]: ["investigador_contratado", "docente_investigador"] },
    },
    order: [["id", "ASC"]],
  });
  console.log(`  · Usuarios asignables a despachos: ${usuariosAsignables.length}`);

  let idxUsuario = 0;
  for (const despacho of despachos) {
    const r = Math.random();

    // Caso 1: asignar a PERSONA (solo si hay usuarios válidos)
    if (r < 0.5 && usuariosAsignables.length > 0) {
      const usuario = usuariosAsignables[idxUsuario % usuariosAsignables.length];
      idxUsuario++;

      // despacho asignado a persona -> ni EINA ni depto
      await despacho.update({ asignadoAEina: false, departamentoId: null });

      await UsuarioEspacio.findOrCreate({
        where: {
          usuarioId: usuario.id,
          espacioId: despacho.gid,
        },
      });

      console.log(
        `    · Despacho ${despacho.id_espacio || despacho.gid} asignado a usuario ${usuario.email}`
      );
    } else {
      // Caso 2: asignar a departamento (INF o ELEC) al azar
      const hayInf = !!dInf;
      const hayElec = !!dElec;

      let deptoId = null;
      if (hayInf && hayElec) {
        deptoId = Math.random() < 0.5 ? dInf.id : dElec.id;
      } else if (hayInf) {
        deptoId = dInf.id;
      } else if (hayElec) {
        deptoId = dElec.id;
      }

      if (deptoId) {
        await despacho.update({ asignadoAEina: false, departamentoId: deptoId });
        console.log(
          `    · Despacho ${despacho.id_espacio || despacho.gid} asignado a depto ${deptoId}`
        );
      } else {
        // caso raro: no hay departamentos -> lo dejamos sin asignar
        console.log(
          `    · Despacho ${despacho.id_espacio || despacho.gid} sin depto porque no hay dInf/dElec`
        );
      }
    }
  }

  console.log("✓ Asignaciones de espacios iniciales creadas");
}

module.exports = cargarAsignacionesEspacios;