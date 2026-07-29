const express = require("express");
const { connectDB } = require("./config/database");
const apiRoutes = require("./api/routes");
const cors = require("cors");
require("dotenv").config();
require("./api/models");

const {
  startLimitPolicyReminderJob,
} = require("./jobs/limitPolicyReminder.job");
const {
  startOverdueDebtReminderJob,
} = require("./jobs/overdueDebtReminder.job");

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://qui-shrimp-fe.vercel.app",
  "https://nhanong.store",
  "https://www.nhanong.store",
];

const envAllowedOrigins = String(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envAllowedOrigins])
);

const isAllowedVercelPreview = (origin = "") => {
  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".vercel.app") &&  
      url.hostname.startsWith("qui-shrimp")
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.use("/api", apiRoutes);

const startServer = async () => {
  await connectDB();

  startLimitPolicyReminderJob();
  startOverdueDebtReminderJob();

  app.listen(process.env.PORT, () => {
    console.log(`Server chạy tại port ${process.env.PORT}`);
  });
};

startServer();
