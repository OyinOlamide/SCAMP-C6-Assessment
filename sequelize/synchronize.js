const { Admin } = require("./models/Admin");
const { Invoice } = require("./models/Invoice");
const { InvoiceItem } = require("./models/InvoiceItem");
const { Payment } = require("./models/Payment");
const { PaymentAlert } = require("./models/PaymentAlert");
const { User } = require("./models/User");

Invoice.belongsTo(User);
Invoice.hasMany(InvoiceItem);
Invoice.hasMany(Payment);
InvoiceItem.belongsTo(Invoice);
Payment.belongsTo(Invoice);
PaymentAlert.belongsTo(Invoice);
PaymentAlert.belongsTo(User);
User.hasMany(Invoice);

async function migrate() {
  await User.sync({ force: true });
  await Admin.sync({ force: true });
  await Invoice.sync({ force: true });
  await InvoiceItem.sync({ force: true });
  await Payment.sync({ force: true });
  await PaymentAlert.sync({ force: true });
}

migrate();
