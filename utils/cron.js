const cron = require("node-cron");
const { Invoice } = require("../sequelize/models/Invoice");
const { Op } = require("sequelize");
const { DateTime } = require("luxon");
const { emailer } = require("./emailer");
const { User } = require("../sequelize/models/User");

cron.schedule("* * * * *", async () => {
  Invoice.belongsTo(User);
  const invoices = await Invoice.findAll({
    where: {
      dateDue: {
        [Op.lt]: DateTime.now().startOf("day"),
      },
      status: {
        [Op.ne]: "paid",
      },
    },
    include: User,
  });
  for await (const invoice of invoices) {
    console.log("Sending invoice");
    let info = await emailer.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`, // sender address
      to: invoice.User.email, // list of receivers
      subject: "Re: Invoice from Freelancer", // Subject line // plain text body
      html: `
        <p>Hello ${invoice.User.firstName},</p>
        <p>We've sent an invoice for you.</p>
        <p>Please click this <a href="${process.env.APP_URL}/invoices/render/${invoice.id}">link</a> to pay your invoice.</p>

        `,
    });
    console.log("Sent invoice");
  }
});
