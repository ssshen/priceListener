const nodemailer = require("nodemailer");
const http = require("https");

let transporter = nodemailer.createTransport({
    service: "qq",
    port: 465,
    secureConnection: true,
    auth: {
        user: "891729308@qq.com", // generated ethereal user
        pass: "" // generated ethereal password
    }
});

// setup email data with unicode symbols
let mailOptions = {
    from: '"意大利炮" <891729308@qq.com>', // sender address
    to: "githubonly@163.com", // list of receivers
    subject: "--监控提醒--", // Subject line
    text: "一切准备就绪，开始交易", // plain text body
    html: "<b>一切准备就绪，开始交易</b>" // html body
};

function getKlineData() {
    http.get("https://api.huobi.vn/market/history/kline?symbol=btcusdt&period=4hour&size=20", res => {
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
    console.log("===============================================");
    if (data[0].close < min) {
        msg = "跌破趋势值，开空";
        console.log("跌破趋势值，开空");
    }
    if (data[0].close > max) {
        msg = "突破趋势值， 开多";
        console.log("突破趋势值， 开多");
    }
    if (msg) {
        sendMail({ content: msg });
    }
    console.log("max:", max);
    console.log("min:", min);
    console.log("current:", data[0].close);
    console.log("===============================================");
}

setInterval(() => {
    getKlineData();
}, 5000);

sendMail({ content: "应用启动", subject: "开始搬砖" });
setInterval(() => {
    sendMail({ content: "应用保持", subject: "我还活着" });
}, 5 * 3600 * 1000);
