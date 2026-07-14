const express = require("express");
const { connectDB, sequelize } = require("./config/database");
const apiRoutes = require("./api/routes");
const cors = require("cors");
require("dotenv").config();
require("./api/models");

const {
  startLimitPolicyReminderJob,
} = require("./jobs/limitPolicyReminder.job");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://qui-shrimp-fe.vercel.app",
  ],
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
  await sequelize.sync();

  startLimitPolicyReminderJob();

  app.listen(process.env.PORT, () => {
    console.log(`Server chạy tại port ${process.env.PORT}`);
  });
};

startServer();
