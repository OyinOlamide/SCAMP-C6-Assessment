const { isValidDate } = require("iso-datestring-validator");

const { Admin } = require("../sequelize/models/Admin");
const oneWord = (word, field = "") => {
  if (word.split(" ").length !== 1) {
    throw new Error(`${field} must contain only one word`);
  }
  return true;
};

const uniqueEmail = async (email, Model, entity = "admin", req = null) => {
  const instances = await Model.findAll({
    where: {
      email,
    },
  });
  if (req !== null) {
    if (instances[0].id == req.params.id) {
      return true;
    }
  }
  if (instances.length) {
    throw new Error(`A/an ${entity} already exists with that email address`);
  }
  return true;
};

const isValidISO801 = (value, field) => {
  if (!isValidDate(value)) {
    throw new Error(
      `${field} must be a valid ISO 801 date string - YYYY-MM-DD`
    );
  }
  return true;
};

module.exports = {
  oneWord,
  uniqueEmail,
  isValidISO801,
};
