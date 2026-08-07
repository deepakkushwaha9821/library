const sequelize = require('./database');

const connectDB = async () => {
  try {
    console.log(`Connecting to SQLite database at ${process.env.SQLITE_PATH || './database.sqlite'}`);
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('SQLite connected successfully');
  } catch (error) {
    console.error(`SQLite connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
