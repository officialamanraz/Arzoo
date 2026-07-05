// Ye do lines sabse zyada zaroori hain! Inke bina .env file nahi chalti.
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.host) {
  throw new Error('env file me host ka value nahi he');
} else if (!process.env.user) {
  throw new Error('env file me user ka value nhi he');
} else if (!process.env.password) {
  throw new Error('env file me password ka value nhi he');
} else if (!process.env.port) {
  throw new Error('env file me port ka value nhi he');
} else if (!process.env.database) {
  throw new Error('env file me database ka value nhi he');
} else if (!process.env.JWT_SECRET) {
  throw new Error('env file me JWT_SECRET ka value nhi he');
}

const configdb = {
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  port: process.env.port,
  database: process.env.database,
};

module.exports = configdb;
