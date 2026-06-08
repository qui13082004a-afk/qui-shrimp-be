const express = require("express");
const { connectDB, sequelize } = require("./config/database");
const apiRoutes = require("./api/routes");

require("dotenv").config();
require("./api/models");

const app = express();

app.use(express.json());

app.use("/api", apiRoutes);
const startServer = async () => {
  await connectDB();

  await sequelize.sync();

  app.listen(process.env.PORT, () => {
    console.log(`Server chạy tại port ${process.env.PORT}`);
  });
};

startServer();