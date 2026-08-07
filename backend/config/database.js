const { Sequelize } = require("sequelize");
const Database = require("better-sqlite3");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.SQLITE_PATH || "./database.sqlite",
  dialectModule: Database,
  logging: false,
});

module.exports = sequelize;