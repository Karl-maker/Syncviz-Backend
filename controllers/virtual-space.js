const VS = require("../services/virtual-space");
const wrapper = require("../middlewares/wrapper");
const constants = require("../constants");
const config = require("../config");
const VirtualSpace = require("../services/virtual-space");
const authenticate = require("../middlewares/authenticate");
const errorHandler = require("../utils/socket-error-handler");

module.exports = virtualSpaceHandler = async (io) => {
 const NameSpace = io.of(constants.namespaces.VIRTUAL_SPACE);

 NameSpace.use(wrapper(authenticate));

 NameSpace.on("connection", async (socket) => {
  const VirtualSpace = new VS({});
  const User = socket.request.user;
  // Actions when user connects to ns

  User.socket_id = socket.id;
  VirtualSpace.socket = socket;
  VirtualSpace.attendee = User;

  // Events avaliable to users not connected to a vs

  socket.on("join", joinVirtualSpace);
  socket.on("create", createVirtualSpace);
  socket.on("disconnect", leaveVirtualSpace);
  socket.on("send-message", sendMessageToChat);

  // Methods

  function joinVirtualSpace({ virtual_space_id }) {
   VirtualSpace.join(virtual_space_id)
    .then(({ message, virtual_space }) => {
     socket.emit("updates", { message, virtual_space });

     socket.broadcast.to(virtual_space_id).emit("updates", {
      message: `guest has joined`,
     });
    })
    .catch((err) => {
     errorHandler(err, socket);
    });
  }

  function createVirtualSpace({ name, description }) {
   VirtualSpace.create({ creator_id: socket.id, name, description })
    .then(({ message, virtual_space }) => {
     socket.emit("updates", { message, virtual_space });
     return { virtual_space };
    })
    .then(({ virtual_space }) => {
     return VirtualSpace.join(virtual_space._id.toString())
      .then(({ message, virtual_space }) => {
       socket.emit("updates", { message, virtual_space });
       return { virtual_space };
      })
      .catch((err) => {
       throw err;
      });
    })
    .then(({ virtual_space }) => {
     VirtualSpace.time(NameSpace.to(virtual_space._id.toString()))
      .then(() => {})
      .catch((err) => errorHandler(err, socket));
    })
    .catch((err) => {
     errorHandler(err, socket);
    });
  }

  function leaveVirtualSpace() {
   if (socket.id === VirtualSpace.creator_id) {
    // Creator has left...
    // Clear room

    VirtualSpace.end()
     .then(() =>
      NameSpace.to(VirtualSpace._id).emit("alerts", {
       message: `Virtual space has closed`,
      })
     )
     .then(() => {
      NameSpace.to(VirtualSpace._id).disconnectSockets();
     })
     .catch((err) => errorHandler(err, socket));
   } else {
    VirtualSpace.leave()
     .then(() => {
      socket.broadcast.to(VirtualSpace.id).emit("updates", {
       message: `guest ${VirtualSpace.attendee.socket_id} has left`,
      });
     })
     .catch((err) => errorHandler(err, socket));
   }
  }

  function sendMessageToChat({ message }) {
   const Message = require("../services/message");
   VirtualSpace.chat.add(
    new Message(message, { sender: VirtualSpace.attendee })
   );
  }
 });
};
