import express from "express";
import cookieParser from "cookie-parser";
import router from "./routes";
import { prisma } from "./db";
import os from "os"
import path from "path"
import "dotenv/config";

const PORT = process.env.PORT || 3000;
const app = express()
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type")

  if (req.method === "OPTIONS") {
      return res.sendStatus(204)
  }
  next()
})
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/",router)

async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log("Server is Running");
      console.log(`http://localhost:${PORT}`);

      const ipAddresses = getIPv4Addresses();
      ipAddresses.forEach((ip: string) => {
        console.log(`http://${ip}:${PORT}`);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

function getIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      for (const inter of networkInterface) {
        if (inter.family === "IPv4" && !inter.internal) {
          addresses.push(inter.address);
        }
      }
    }
  }
  return addresses;
}

startServer();
