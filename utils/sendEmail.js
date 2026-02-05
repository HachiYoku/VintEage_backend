const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  await resend.emails.send({
    from: `My App <${process.env.EMAIL_FROM}>`, // works immediately
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;