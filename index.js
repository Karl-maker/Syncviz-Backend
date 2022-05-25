const virtualSpaceHandler = require("./controllers/virtual-space");

module.exports = function () {
 const io = this.io;

 // Namespaces..

 virtualSpaceHandler(io);
};
