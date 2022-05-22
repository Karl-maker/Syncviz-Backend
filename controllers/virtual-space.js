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

  NameSpace.on("connection", async (socket) => {
    const VirtualSpace = new VS({ vs: NameSpace });
    const example = socket.request.example; // EXAMPLE
    // Actions when user connects to ns

    if (socket.handshake.query.vs_id) {
      // Connect to Virtual Space
    } else {
      // Events avaliable to users not connected to a vs
      socket.on("create", await createVirtualSpace({ socket, VirtualSpace }));
      socket.on("info", updateVirtualSpace({ socket, VirtualSpace }));
      socket.on("disconnect", () => {});
    }
  });
};

// Using functions so that the use of call and bind can be considered

async function createVirtualSpace({ socket, VirtualSpace }) {
  return async ({ name }) => {
    VirtualSpace.name = name;
    await VirtualSpace.create();
  };
}

function updateVirtualSpace({ socket, VirtualSpace }) {
  return (args) => {
    socket.emit("updates", VirtualSpace.get());
  };
}
