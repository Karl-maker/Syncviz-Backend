const virtualSpaceHandler = require("./controllers/virtual-space");

module.exports = function () {
  io = this.io;

  // Namespaces..

  virtualSpaceHandler(io);
};
