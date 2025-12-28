const express = require("express");
const path = require("path");
const os = require("os");

const app = express();

app.use(express.static(path.join(__dirname, "./static")));

app.use("/", (req, res, next) => {
    res.sendFile(path.join(__dirname, "./static/index.html"));
});

function getIPv4Addresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === "IPv4" && !interface.internal) {
                addresses.push(interface.address);
            }
        }
    }
    return addresses;
}

app.listen(3000, () => {
    console.log("Server is Running");
    console.log(`http://localhost:${process.env.PORT || 3000}`);

    const ipAddresses = getIPv4Addresses();
    ipAddresses.forEach((ip) => {
        console.log();
        console.log(`http://${ip}:${process.env.PORT || 3000}`);
    });
});
