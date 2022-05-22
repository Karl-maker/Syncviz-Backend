const VS = require("../services/virtual-space");
const wrapper = require("../middlewares/wrapper");
const constants = require("../constants");

module.exports = virtualSpaceHandler = (io) => {
  const NameSpace = io.of(constants.namespaces.VIRTUAL_SPACE);

  NameSpace.use(
    wrapper((req, res, next) => {
      // Any middleware..
      req.example = { message: "Hello World" }; // EXAMPLE
      next();
    })
  );

  NameSpace.on("connection", (socket) => {
    const VirtualSpace = new VS({});
    const example = socket.request.example; // EXAMPLE
    // Actions when user connects to ns

    if (socket.handshake.query.vs_id) {
      // Connect to Virtual Space
    } else {
      // Events avaliable to users not connected to a vs
      socket.on("create", (args) => {});
      socket.on("disconnect", () => {});
    }
  });
};
