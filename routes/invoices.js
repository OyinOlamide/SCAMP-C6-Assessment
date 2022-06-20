let express = require("express");
let router = express.Router();
const dotenv = require("dotenv");
const { body, validationResult } = require("express-validator");
const { Invoice } = require("../sequelize/models/Invoice");
const { InvoiceItem } = require("../sequelize/models/InvoiceItem");
const { adminIsLoggedIn } = require("../middleware/admin.is.logged.in");
const { isValidISO801 } = require("../utils/validators");
const { User } = require("../sequelize/models/User");
const validator = require("validator");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");
const { emailer } = require("../utils/emailer");

dotenv.config();
Invoice.hasMany(InvoiceItem);
Invoice.belongsTo(User);
router.post(
  "/",
  adminIsLoggedIn,
  body("dateDue").custom((value) => isValidISO801(value, "date due")),
  body("userId")
    .isInt()
    .custom(async function (id, { req }) {
      const user = await User.findByPk(id);
      if (user === null) {
        throw new Error(`No user exists with that ID`);
      }
      req.user = user;
      return true;
    }),
  body("items").custom((value) => {
    if (
      value.every((item) => {
        return (
          item.quantity &&
          item.price &&
          item.description &&
          validator.isNumeric(item.quantity) &&
          validator.isNumeric(item.price) &&
          item.description.length
        );
      })
    ) {
      return true;
    } else {
      throw new Error("Invalid Invoice Item");
    }
  }),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array()[0] });
    }
    Invoice.hasMany(InvoiceItem);
    User.hasMany(Invoice);
    const invoice = await req.user.createInvoice({
      dateDue: DateTime.fromISO(req.body.dateDue).toJSDate(),
      status: "active",
    });
    for await (const item of req.body.items) {
      await invoice.createInvoiceItem({
        description: item.description,
        price: item.price,
        quantity: item.price,
      });
    }
    let refreshedInvoice = await invoice.reload({
      include: InvoiceItem,
    });
    res.status(201).json({
      message: "Invoice created successfully",
      data: {
        invoice: refreshedInvoice,
      },
    });
  }
);

router.delete("/:id", adminIsLoggedIn, async function (req, res) {
  const invoice = await Invoice.findByPk(req.params.id);
  if (invoice === null) {
    res.status(404).json({
      errors: {
        value: null,
        msg: "No invoice exists with that primary key",
        param: null,
        location: null,
      },
    });
  } else {
    Invoice.hasMany(InvoiceItem);
    const invoiceItems = await invoice.getInvoiceItems();
    for await (const item of invoiceItems) {
      await item.destroy();
    }
    await invoice.destroy();
    res.status(201).json({
      message: "Invoice deleted successfully",
      data: null,
    });
  }
});

router.put(
  "/:id",
  adminIsLoggedIn,
  body("dateDue").custom((value) => isValidISO801(value, "date due")),
  body("items").custom((value) => {
    if (
      value.every((item) => {
        return (
          item.quantity &&
          item.price &&
          item.description &&
          validator.isNumeric(item.quantity) &&
          validator.isNumeric(item.price) &&
          item.description.length
        );
      })
    ) {
      return true;
    } else {
      throw new Error("Invalid Invoice Item");
    }
  }),
  async function (req, res) {
    Invoice.hasMany(InvoiceItem);
    const invoice = await Invoice.findByPk(req.params.id, {
      include: InvoiceItem,
    });
    console.log(invoice);
    if (invoice === null) {
      res.status(404).json({
        errors: {
          value: null,
          msg: "No invoice exists with that primary key",
          param: null,
          location: null,
        },
      });
    } else {
      Invoice.hasMany(InvoiceItem);
      invoice.dateDue = req.body.dateDue || invoice.dateDue;
      await invoice.save();
      if (req.body.items.length) {
        for await (const item of invoice.InvoiceItems) {
          await item.destroy();
        }
        for await (const item of req.body.items) {
          await invoice.createInvoiceItem({
            description: item.description,
            price: item.price,
            quantity: item.price,
          });
        }
      }
      res.status(201).json({
        message: "Invoice updated successfully",
        data: null,
      });
    }
  }
);

router.get("/", adminIsLoggedIn, async function (req, res) {
  Invoice.hasMany(InvoiceItem);
  const invoices = await Invoice.findAll({ include: InvoiceItem });
  res.status(200).json({
    message: "Invoices fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/user/:id", adminIsLoggedIn, async function (req, res) {
  const invoices = await Invoice.findAll({
    where: { UserId: req.params.id },
    include: InvoiceItem,
  });
  res.status(200).json({
    message: "Invoices fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/user/:id/unpaid", adminIsLoggedIn, async function (req, res) {
  const invoices = await Invoice.findAll({
    where: { UserId: req.params.id, status: "active" },
    include: InvoiceItem,
  });
  res.status(200).json({
    message: "Invoices fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/user/:id/paid", adminIsLoggedIn, async function (req, res) {
  const invoices = await Invoice.findAll({
    where: { UserId: req.params.id, status: "paid" },
    include: InvoiceItem,
  });
  res.status(200).json({
    message: "Invoices fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/unpaid", adminIsLoggedIn, async function (req, res) {
  const invoices = await Invoice.findAll({
    where: { status: "active" },
    include: InvoiceItem,
  });
  res.status(200).json({
    message: "Invoices fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/paid", adminIsLoggedIn, async function (req, res) {
  const invoices = await Invoice.findAll({
    where: { status: "paid" },
    include: InvoiceItem,
  });
  res.status(200).json({
    message: "Invoices fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/overdue", adminIsLoggedIn, async function (req, res) {
  const invoices = await Invoice.findAll({
    where: {
      dateDue: {
        [Op.lt]: DateTime.now().startOf("day"),
      },
      status: {
        [Op.ne]: "paid",
      },
    },
  });
  res.status(200).json({
    message: "Invoice fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/users/:id/overdue", adminIsLoggedIn, async function (req, res) {
  const invoices = await Invoice.findAll({
    where: {
      dateDue: {
        [Op.lt]: DateTime.now().startOf("day"),
      },
      UserId: req.params.id,
      status: {
        [Op.ne]: "paid",
      },
    },
    include: InvoiceItem,
  });
  res.status(200).json({
    message: "Invoice fetched successfully",
    data: {
      invoices,
    },
  });
});

router.get("/:id", adminIsLoggedIn, async function (req, res) {
  const invoice = await Invoice.findByPk(req.params.id, {
    include: InvoiceItem,
  });
  res.status(200).json({
    message: "Invoice fetched successfully",
    data: {
      invoice,
    },
  });
});

router.get("/:id/mark-as-paid", async function (req, res) {
  Invoice.hasMany(InvoiceItem);
  Invoice.belongsTo(User);
  const invoice = await Invoice.findByPk(req.params.id, {
    include: [InvoiceItem, User],
  });
  invoice.status = "paid";
  await invoice.save();
  await invoice.reload({ include: InvoiceItem });
  return res.render("invoice", {
    invoice,
    appName: process.env.APP_NAME,
    appUrl: process.env.APP_URL,
    isOverdue:
        DateTime.now().startOf("day") >
        DateTime.fromISO(invoice.dateDue).startOf("day"),
  });
});

router.post("/:id/send-invoice", adminIsLoggedIn, async function (req, res) {
  Invoice.belongsTo(User);
  const invoice = await Invoice.findByPk(req.params.id, { include: User });
  if (invoice === null) {
    return res.status(400).json({
      errors: {
        value: null,
        msg: "Invalid invoice ID",
        param: null,
        location: null,
      },
    });
  }
  if (invoice.status === "paid") {
    return res.status(400).json({
      errors: {
        value: null,
        msg: "You cannot send an already paid invoice",
        param: null,
        location: null,
      },
    });
  }

  let info = await emailer.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`, // sender address
    to: invoice.User.email, // list of receivers
    subject: "Invoice from Freelancer", // Subject line // plain text body
    html: `
        <p>Hello ${invoice.User.firstName},</p>
        <p>We've sent an invoice for you.</p>
        <p>Please click this <a href="${process.env.APP_URL}/invoices/render/${invoice.id}">link</a> to pay your invoice.</p>

        `, // html body
  });
  return res.status(201).json({
    message: "Invoice sent successfully",
    data: {
      invoice,
    },
  });
});

router.get("/render/:id", async function (req, res) {
  const invoice = await Invoice.findByPk(req.params.id, {
    include: [InvoiceItem, User],
  });
  return res.render("invoice", {
    invoice,
    appName: process.env.APP_NAME,
    appUrl: process.env.APP_URL,
    isOverdue:
      DateTime.now().startOf("day") >
      DateTime.fromISO(invoice.dateDue).startOf("day"),
  });
});

module.exports = router;
