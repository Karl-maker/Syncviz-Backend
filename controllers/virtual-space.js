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

  // Return current user data

  socket.emit("current-user", VirtualSpace.attendee.get());

  // Events avaliable to users not connected to a vs

  socket.on("join", joinVirtualSpace);
  socket.on("create", createVirtualSpace);
  socket.on("disconnect", leaveVirtualSpace);
  socket.on("delete", endVirtualSpace);
  socket.on("send-message", sendMessageToChat);
  socket.on("send-blob", sendBlob);
  socket.on("send-direct-blob", sendDirectBlob);
  socket.on("speak", sendAudio);

  /*

  Listeners

  1. updates - general updates e.g. when users join
  2. alerts - major alerts
  3. messages / private-messages - messages
  4. live-audios - live audio data
  5. blobs - blob data (imgs, 3d, video)
  6. viewers - viewers attending virtual space 
  7. attributes - virtual space attributes
  8. timer - time limit
  9. me - my data

  */

  function sendAudio(audio) {
   socket.broadcast.to(VirtualSpace.id).emit("live-audios", audio);
  }

  function joinVirtualSpace() {
   virtual_space_id = socket.handshake.query.virtual_space_id;

   VirtualSpace.join(virtual_space_id)
    .then(({ message, virtual_space }) => {
     // Notify current attendees of updated viewer list
     VirtualSpace.getSocketClients(NameSpace.in(VirtualSpace._id)).then(
      (viewers) => {
       NameSpace.to(VirtualSpace._id).emit("viewers", viewers);
      }
     );

     // Send new attendee the current attributes of meeting
     socket.emit("attributes", { virtual_space });

     // Notify current attendees who has joined
     NameSpace.to(VirtualSpace.id).emit("updates", {
      message: `${VirtualSpace.attendee.username} has joined`,
     });
    })
    .catch((err) => {
     // Disconnect socket
     socket.disconnect(true);
     errorHandler(err, socket);
    });
  }

  function createVirtualSpace({ name, description }) {
   VirtualSpace.create({ creator_id: socket.id, name, description })
    .then(({ message, virtual_space }) => {
     // Prompt creator
     socket.emit("alerts", { message });
     return { virtual_space };
    })
    .then(({ virtual_space }) => {
     // Join and Get current viewer's list which should only be the creator
     return VirtualSpace.join(virtual_space._id.toString())
      .then(({ message, virtual_space }) => {
       VirtualSpace.getSocketClients(NameSpace.in(VirtualSpace._id)).then(
        (viewers) => {
         NameSpace.to(VirtualSpace._id).emit("viewers", viewers);
        }
       );

       // Send new attendee the current attributes of meeting
       socket.emit("attributes", { virtual_space });
       return { virtual_space };
      })
      .catch((err) => {
       throw err;
      });
    })
    .then(({ virtual_space }) => {
     // Start timer
     VirtualSpace.time(NameSpace.to(virtual_space._id.toString()))
      .then(() => {})
      .catch((err) => errorHandler(err, socket));
    })
    .catch((err) => {
     errorHandler(err, socket);
    });
  }

  function endVirtualSpace() {
   if (User.socket_id === VirtualSpace.creator_id) {
    VirtualSpace.end()
     .then(() =>
      NameSpace.to(VirtualSpace._id).emit("alerts", {
       message: `Virtual space was ended by host`,
      })
     )
     .then(() => {
      NameSpace.to(VirtualSpace._id).disconnectSockets();
     })
     .catch((err) => errorHandler(err, socket));
   }
  }

  function leaveVirtualSpace() {
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
     if (socket.id !== VirtualSpace.creator_id) {
      socket.disconnect(true);
     }
    })
    .catch((err) => errorHandler(err, socket));
   //}
  }

  function sendMessageToChat({ message }) {
   const Message = require("../services/message");
   VirtualSpace.chat.add(
    new Message(message, { sender: VirtualSpace.attendee })
   );
  }

  function sendDirectBlob({ user_id }) {
   VirtualSpace.getSocketClients(NameSpace.in(VirtualSpace._id)).then(
    ({ users }) => {
     // check if in viewers list

     NameSpace.to(user_id).emit("blobs", VirtualSpace.blob.data);
    }
   );
  }

  function sendBlob(file) {
   VirtualSpace.blob.data = file;
   NameSpace.to(VirtualSpace._id).emit("blobs", VirtualSpace.blob.data);
  }
 });
};
