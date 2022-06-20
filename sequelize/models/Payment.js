const { DataTypes } = require("sequelize");
const { sequelize } = require("../connection");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "Payment",
  }
);

module.exports = {
  Payment,
};
