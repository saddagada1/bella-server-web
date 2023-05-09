import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  // let testAccount = await nodemailer.createTestAccount();
  // console.log("test account: ", testAccount);

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "c4ozg6jra7qlcfr7@ethereal.email",
      pass: "QpASBr3emxNCQbfNrd",
    },
  });

  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>',
    to,
    subject,
    html,
  });

  console.log("Message sent: %s", info.messageId);

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
