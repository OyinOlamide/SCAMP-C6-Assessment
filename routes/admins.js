let express = require("express");
let router = express.Router();
const { oneWord, uniqueEmail } = require("../utils/validators");
const { body, validationResult } = require("express-validator");
const { Admin } = require("../sequelize/models/Admin");
const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { adminIsLoggedIn } = require("../middleware/admin.is.logged.in");

dotenv.config();

/* GET home page. */
router.post(
  "/register",
  body("firstName")
    .isString()
    .custom((value) => oneWord(value, "First name"))
    .trim(),
  body("lastName")
    .isString()
    .custom((value) => oneWord(value, "First name"))
    .trim(),
  body("email")
    .isString()
    .isEmail()
    .normalizeEmail()
    .trim()
    .custom(async (value) => uniqueEmail(value, Admin)),
  body("password").isString().isStrongPassword(),
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array()[0] });
    }
    const admin = await Admin.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: passwordHash.generate(req.body.password),
    });
    res.status(201).json({
      message: "Admin registered successfully. You may login",
      data: {
        admin: admin.toJSON(),
      },
    });
  }
);

router.post(
  "/login",
  body("email").isString().isEmail().normalizeEmail().trim(),
  body("password").isString().trim(),
  async function (req, res, next) {
    const admin = await Admin.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (admin === null) {
      return res.status(400).json({
        errors: {
          value: req.body.email,
          msg: "No admin exists with specified email",
          param: "email",
          location: "body",
        },
      });
    }
    if (passwordHash.verify(req.body.password, admin.password)) {
      // Generate JWT Token
      const token = jwt.sign({ id: admin.id }, process.env.JWT_PRIVATE_KEY, {
        expiresIn: "30m",
      });
      res.status(201).json({
        message: "Logged in successfully",
        data: {
          admin: admin.toJSON(),
          token,
        },
      });
    } else {
      return res.status(400).json({
        errors: {
          value: null,
          msg: "Invalid login credentials",
          param: null,
          location: null,
        },
      });
    }
  }
);

router.post("/refresh-token", adminIsLoggedIn, function (req, res) {
  const admin = req.admin;
  const token = jwt.sign({ id: admin.id }, process.env.JWT_PRIVATE_KEY, {
    expiresIn: "30m",
  });
  res.status(201).json({
    message: "Token refreshed successfully",
    data: {
      admin: admin.toJSON(),
      token,
    },
  });
});

module.exports = router;
