function validateLoginDto(body) {
  const { email, password } = body;

  if (!email) {
    throw new Error("El campo email es obligatorio");
  }

  if (typeof email !== "string" || !email.includes("@")) {
    throw new Error("El email debe tener un formato válido");
  }

  if (!password) {
    throw new Error("El campo password es obligatorio");
  }

  if (typeof password !== "string" || password.length < 1) {
    throw new Error("El password no es válido");
  }

  return {
    email: email.trim().toLowerCase(),
    password: password.trim(),
  };
}

module.exports = {
  validateLoginDto,
};
