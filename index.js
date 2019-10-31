const nodemailer = require("nodemailer");
const https = require("https");
const config = require("./config.js");

let transporter = nodemailer.createTransport({
    service: "qq",
    port: 465,
    secureConnection: true,
    auth: {
        user: config.from,
        pass: config.secret
    }
});

// setup email data with unicode symbols
let mailOptions = {
    from: `"price listener" <${config.from}>`,
    to: config.to,
    subject: "--监控提醒--",
    html: "<b>一切准备就绪，开始交易</b>"
};

let alertEmailSent = false;

function getKlineData() {
    https.get(config.url, res => {
        let data = "";
        res.on("data", trunk => {
            data += trunk;
        });
        res.on("end", () => {
            dealKlineData(JSON.parse(data).data);
        });
    });
}

function sendMail({ content, subject }) {
    if (subject) {
        mailOptions.subject = subject;
    }
    mailOptions.html = `<b>${content}</b>`;
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);
    });
}
let currentLow = 0;
let currentHigh = 0;
let emailAlertTimeout;
function dealKlineData(data) {
    let max = Number.MIN_VALUE;
    let min = Number.MAX_VALUE;
    for (var i = 0; i < data.length; i++) {
        if (data[i].high > max) {
            max = data[i].high;
        }
        if (data[i].low < min) {
            min = data[i].low;
        }
    }
    let msg = "";
    if (currentLow != data[0].low) {
        alertEmailSent = false;
        emailAlertTimeout && clearTimeout(emailAlertTimeout);
        currentLow = data[0].low;
    }
    if (currentHigh != data[0].high) {
        alertEmailSent = false;
        emailAlertTimeout && clearTimeout(emailAlertTimeout);
        currentHigh = data[0].high;
    }
    if (currentLow <= min) {
        msg = `跌破趋势值，开空\n-------------\ncurrentLow:${currentLow}\nmin:${min}\nmax:${max}`;
    }
    if (currentHigh >= max) {
        msg = `突破趋势值，开多\n-------------\ncurrentHigh:${currentHigh}\nmin:${min}\nmax:${max}`;
    }
    if (msg && !alertEmailSent) {
        sendMail({ content: msg, subject: "--监控提醒--" });
        alertEmailSent = true;
        emailAlertTimeout = setTimeout(() => {
            alertEmailSent = false;
        }, config.emailAlertInterval);
    }
    console.log(new Date().toLocaleString(), " ===============================================");
    console.log("max:", max);
    console.log("min:", min);
    console.log("current:", data[0].close);
}

setInterval(() => {
    getKlineData();
}, config.queryInterval);

sendMail({ content: "start engine", subject: "开始搬砖" });
