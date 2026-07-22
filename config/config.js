require('dotenv').config();

const RAILWAY_DB = {
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'vDgXilOnfJIwqCxfRKFMCYnxQmTvYCSK',
  database: process.env.DB_NAME || 'railway',
  host: process.env.DB_HOST || 'sakura.proxy.rlwy.net',
  port: process.env.DB_PORT || 36506,
  dialect: 'mysql',
  logging: false
};

module.exports = {
  development: {
    ...RAILWAY_DB,
    logging: console.log
  },
  test: {
    ...RAILWAY_DB,
    logging: false
  },
  production: {
    ...RAILWAY_DB,
    logging: false
  }
};
