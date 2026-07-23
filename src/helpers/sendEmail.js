const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  const { data, error } = await resend.emails.send({
    from: "Nhà Nông <onboarding@nhanong.store>",
    to,
    subject,
    text,
  });

  if (error) {
    console.error(error);
    throw new Error("Không gửi được email");
  }

  console.log("Email sent:", data);
};

module.exports = sendEmail;