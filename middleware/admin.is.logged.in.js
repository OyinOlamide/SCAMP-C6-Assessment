const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Admin } = require("../sequelize/models/Admin");

dotenv.config();

const adminIsLoggedIn = async function (req, res, next) {
  let authHeader = req.headers["authentication"];
  console.log(authHeader);
  if (authHeader) {
    if (authHeader.split(" ").length !== 2) {
      return err(res);
    }
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
      const admin = await Admin.findByPk(payload.id);
      if (admin === null) {
        return err(res);
      } else {
        req.admin = admin;
        next();
      }
    } catch (er) {
      return err(res);
    }
  } else {
    return err(res);
  }
};

const err = (res) =>
  res.status(401).json({
    errors: {
      value: null,
      msg: "Unauthenticated request!",
      param: null,
      location: null,
    },
  });

module.exports = {
  adminIsLoggedIn,
};
