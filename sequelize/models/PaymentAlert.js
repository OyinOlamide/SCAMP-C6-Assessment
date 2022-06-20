const { DataTypes } = require("sequelize");
const { sequelize } = require("../connection");

const PaymentAlert = sequelize.define(
  "PaymentAlert",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: "PaymentAlert",
  }
);

module.exports = {
  PaymentAlert,
};
