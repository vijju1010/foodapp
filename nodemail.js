const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
module.exports = async function main(email, passcode) {
    console.log('Sending email to ' + email);
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'reddikumar205@gmail.com',
            pass: 'rootroot',
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail(
        {
            from: 'reddikumar205@gmail.com',
            to: email,
            subject: 'Password Reset Code',
            text: 'Your passcode is ' + passcode,
        },
        function (error, info) {
            if (error) {
                console.log(error, 'emailnotsent');
            } else {
                console.log('Email sent: ' + info.response);
            }
        }
    );

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};
