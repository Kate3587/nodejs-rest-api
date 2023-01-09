const sgMail = require('@sendgrid/mail');
require("dotenv").config();

const { SENGRID_API_KEY } = process.env;

sgMail.setApiKey(SENGRID_API_KEY);

const sendMail = async (data) => {
    const mail = { ...data, from: "kate.poliakova7@gmail.com" };

    transporter.sendMail(mail).then(() => console.log("Mail sent")).catch((error) => (console.log(error.message)));
};

module.exports = sendMail;
