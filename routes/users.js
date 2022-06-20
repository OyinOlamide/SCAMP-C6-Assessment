const express = require("express");
const router = express.Router();
const { adminIsLoggedIn } = require("../middleware/admin.is.logged.in");
const { oneWord, uniqueEmail } = require("../utils/validators");
const { body, validationResult } = require("express-validator");
const { User } = require("../sequelize/models/User");

router.post(
  "/",
  adminIsLoggedIn,
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
    .custom(async (value) => uniqueEmail(value, User, "user")),
  body("phoneNumber").isString().trim(),
  body("address").isString().trim(),
  body("state").isString().trim(),
  body("city").isString().trim(),
  body("country").isString().trim(),
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array()[0] });
    }
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      state: req.body.state,
      city: req.body.city,
      country: req.body.country,
    });
    res.status(201).json({
      message: "User registered successfully. You may login",
      data: {
        user: user.toJSON(),
      },
    });
  }
);

router.get("/", adminIsLoggedIn, async function (req, res) {
  const users = await User.findAll();
  res.status(200).json({
    message: "Users fetched successfully",
    data: {
      users,
    },
  });
});

router.get("/:id", adminIsLoggedIn, async function (req, res) {
  const user = await User.findByPk(req.params.id);
  if (user === null) {
    res.status(404).json({
      errors: {
        value: req.body.email,
        msg: "No user exists with that primary key",
        param: null,
        location: null,
      },
    });
  } else {
    res.status(200).json({
      message: "User fetched successfully",
      data: {
        user,
      },
    });
  }
});

router.delete("/:id", adminIsLoggedIn, async function (req, res) {
  const user = await User.findByPk(req.params.id);
  if (user === null) {
    res.status(404).json({
      errors: {
        value: req.body.email,
        msg: "No user exists with that primary key",
        param: null,
        location: null,
      },
    });
  } else {
    await user.destroy();
    res.status(201).json({
      message: "User deleted successfully",
      data: null,
    });
  }
});

router.put(
  "/:id",
  adminIsLoggedIn,
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
    .custom(async (value, { req }) => uniqueEmail(value, User, "user", req)),
  body("phoneNumber").isString().trim(),
  body("address").isString().trim(),
  body("state").isString().trim(),
  body("city").isString().trim(),
  body("country").isString().trim(),
  async function (req, res) {
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      res.status(404).json({
        errors: {
          value: req.body.email,
          msg: "No user exists with that primary key",
          param: "email",
          location: "body",
        },
      });
    } else {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.address = req.body.address || user.address;
      user.state = req.body.state || user.state;
      user.city = req.body.city || user.city;
      user.country = req.body.country || user.country;
      await user.save();
      res.status(201).json({
        message: "User updated successfully",
        data: {
          user,
        },
      });
    }
  }
);
module.exports = router;
