const User = require("../services/user");

module.exports = (req, res, next) => {
 let auth;

 try {
  auth = JSON.parse(req.headers.authorization || '{"username": ""}');
 } catch (err) {
  console.log(err);
 }

 req.user = new User({ username: auth.username || "" });

 next();
};
