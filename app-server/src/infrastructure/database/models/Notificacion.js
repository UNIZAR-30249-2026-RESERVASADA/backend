const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notificacion = sequelize.define("Notificacion", {
    id: {
      type:          DataTypes.BIGINT,
      primaryKey:    true,
      autoIncrement: true,
    },
    usuarioId: {
      type:       DataTypes.BIGINT,
      allowNull:  false,
      references: { model: "usuarios", key: "id" },
    },
    reservaId: {
      type:       DataTypes.BIGINT,
      allowNull:  false,
      references: { model: "reservas", key: "id" },
    },
    motivo: {
      type:      DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
    leida: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
    },
    fechaCreacion: {
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName:  "notificaciones",
    timestamps: false,
  });

  return Notificacion;
};