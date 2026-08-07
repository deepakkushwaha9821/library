const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.SQLITE_PATH || './database.sqlite',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
