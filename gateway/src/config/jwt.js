if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}

module.exports = {
  jwtSecret:    process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
};