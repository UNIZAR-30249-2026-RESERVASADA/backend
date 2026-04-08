const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ReservaEspacio = sequelize.define(
    "ReservaEspacio",
    {
      reservaId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        field: "reserva_id",
        references: {
          model: "reservas",
          key: "id",
        },
      },
      espacioId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        field: "espacio_id",
        references: {
          model: "espacios",
          key: "gid",
        },
      },
      numPersonas: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "num_personas",
      },
    },
    {
      tableName: "reservas_espacios",
      timestamps: false,
    }
  );

  return ReservaEspacio;
};