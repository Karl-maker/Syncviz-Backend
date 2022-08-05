const User = require("../services/user");

module.exports = (req, res, next) => {
 let auth;

 try {
  auth = JSON.parse(req.headers.authorization);
 } catch (err) {}

 req.user = new User({ username: auth.username, color: auth.theme });

 next();
};
