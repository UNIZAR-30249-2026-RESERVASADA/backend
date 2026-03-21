function normalizarTexto(valor) {
  return (valor || "")
    .toString()
    .trim()
    .toLowerCase();
}

function normalizarCategoriaInicial(uso) {
  const valor = normalizarTexto(uso);

  if (
    valor.includes("laboratorio") ||
    valor.includes("lab") ||
    valor.includes("sala informatica") ||
    valor.includes("sala informática") ||
    valor.includes("informatica") ||
    valor.includes("informática")
  ) {
    return "laboratorio";
  }

  if (valor.includes("aula")) return "aula";
  if (valor.includes("seminario")) return "seminario";
  if (valor.includes("despacho")) return "despacho";
  if (valor.includes("comun") || valor.includes("común")) return "sala comun";
  if (valor.includes("pasillo")) return "pasillo";

  return "otros";
}

function esReservableInicialmente(categoria) {
  const valor = normalizarTexto(categoria);

  // Según RFO3: Los despachos SÍ son reservables (por gerentes, investigadores, docentes)
  return (
    valor === "aula" ||
    valor === "seminario" ||
    valor === "laboratorio" ||
    valor === "sala comun" ||
    valor === "despacho"
  );
}

module.exports = {
  normalizarCategoriaInicial,
  esReservableInicialmente,
};