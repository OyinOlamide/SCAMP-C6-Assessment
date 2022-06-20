const { DataTypes } = require("sequelize");
const { sequelize } = require("../connection");

const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dateDue: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(["paid", "unpaid", "active"]),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Invoice",
  }
);

module.exports = {
  Invoice,
};
