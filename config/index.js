require("dotenv-flow").config({
 silent: true,
});

/*
  Central point of all major variables that are needed to run the service.
  Everything should be edited or altered to fit the CPU it will be ran on by using .env files.
  A .example.env file will be avaliable to display all variables used by the system.
*/

const ENV = process.env;
const variables = {
 environment: {
  NODE_ENV: ENV.NODE_ENV || "development",
 },

 server: {
  PORT: ENV.PORT || 5000,
 },

 redis: {
  URL: ENV.REDIS_URL || "redis://localhost:6379",
 },

 db: {
  URI: ENV.DB_URI || "",
  USER: ENV.DB_USER || "",
  PASSWORD: ENV.DB_PASSWORD || "",
 },
};

module.exports = variables;
