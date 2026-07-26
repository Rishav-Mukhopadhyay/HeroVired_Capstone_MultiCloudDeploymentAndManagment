const keys = require('../config/keys');

// No real email provider is wired up in this project (see CLAUDE.md/
// server/README.md) — this "sends" mail by logging what would have gone
// out instead of actually delivering it. Callers (e.g.
// routes/api/order.js) don't need to know that: they call sendMail() the
// same way they would once a real transport (nodemailer + SMTP, SES,
// Postmark, etc.) is plugged in here, so wiring one up later only means
// changing the body of this function.
const sendMail = async ({ to, subject, html }) => {
  console.log('----- MOCK EMAIL (no provider configured) -----');
  console.log(`From:    ${keys.mail.from}`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(html);
  console.log('----- END MOCK EMAIL -----');

  return { mocked: true };
};

module.exports = { sendMail };
