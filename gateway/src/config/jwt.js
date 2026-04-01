module.exports = {
  jwtSecret: process.env.JWT_SECRET || "super_secreto_cambiar_en_produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
};