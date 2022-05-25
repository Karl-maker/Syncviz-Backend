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
  socket.username = User.username;
  VirtualSpace.socket = socket;
  VirtualSpace.attendee = User;

  // Events avaliable to users not connected to a vs

  socket.on("join", joinVirtualSpace);
  socket.on("create", createVirtualSpace);
  socket.on("disconnect", leaveVirtualSpace);
  socket.on("send-message", sendMessageToChat);
  socket.on("upload-3d", transfer3DFile);
  socket.on("speak", transferAudio);

  // Methods

  /*

  Listeners

  1. updates - general updates e.g. when users join
  2. alerts - major alerts
  3. messages - messages
  4. live-audios - live audio data
  5. 3d-files - 3D data
  6. viewers - viewers attending virtual space *
  7. attributes - virtual space attributes
  8. timer - time limit

  Example Code:

  NameSpace.to(virtual_space_id).emit("viewers", {
      viewer: VirtualSpace.attendee,
  });

  socket.emit("updates", { message, virtual_space });

  socket.broadcast.to(virtual_space_id).emit("updates", {
    message: `guest has joined`,
  });

  */

  function transfer3DFile(file) {
   socket.broadcast.to(VirtualSpace.id).emit("3d-files", file);
  }

  function transferAudio(audio) {
   socket.broadcast.to(VirtualSpace.id).emit("live-audios", audio);
  }

  function joinVirtualSpace() {
   virtual_space_id = socket.handshake.query.virtual_space_id;

   VirtualSpace.join(virtual_space_id)
    .then(({ message, virtual_space }) => {
     VirtualSpace.getSocketClients(NameSpace.in(VirtualSpace._id)).then(
      (viewers) => {
       NameSpace.to(VirtualSpace._id).emit("viewers", viewers);
      }
     );

     socket.emit("updates", { message });
     socket.emit("attributes", { virtual_space });
     socket.broadcast.to(virtual_space_id).emit("updates", {
      message: `${VirtualSpace.attendee.username} has joined`,
     });
    })
    .catch((err) => {
     errorHandler(err, socket);
    });
  }

  function createVirtualSpace({ name, description }) {
   VirtualSpace.create({ creator_id: socket.id, name, description })
    .then(({ message, virtual_space }) => {
     socket.emit("updates", { message });
     return { virtual_space };
    })
    .then(({ virtual_space }) => {
     return VirtualSpace.join(virtual_space._id.toString())
      .then(({ message, virtual_space }) => {
       VirtualSpace.getSocketClients(NameSpace.in(VirtualSpace._id)).then(
        (viewers) => {
         NameSpace.to(VirtualSpace._id).emit("viewers", viewers);
        }
       );

       socket.emit("updates", { message });
       socket.emit("attributes", { virtual_space });
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
    VirtualSpace.getSocketClients(NameSpace.in(VirtualSpace._id)).then(
     (viewers) => {
      NameSpace.to(VirtualSpace._id).emit("viewers", viewers);
     }
    );

    VirtualSpace.leave()
     .then(() => {
      socket.broadcast.to(VirtualSpace.id).emit("updates", {
       message: `${VirtualSpace.attendee.username} has left`,
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
