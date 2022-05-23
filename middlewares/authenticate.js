const User = require("../services/user");

module.exports = (req, res, next) => {
 req.user = new User({});

 next();
};
