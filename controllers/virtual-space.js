const VS = require("../services/virtual-space");
const wrapper = require("../middlewares/wrapper");
const constants = require("../constants");
const config = require("../config");
const authenticate = require("../middlewares/authenticate");
const errorHandler = require("../utils/socket-error-handler");

module.exports = virtualSpaceHandler = async (io) => {
 const NameSpace = io.of(constants.namespaces.VIRTUAL_SPACE);

 NameSpace.use(wrapper(authenticate));

 NameSpace.on("connection", async (socket) => {
  const VirtualSpace = new VS();
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
  socket.on("attributes", updateAttributes);
  socket.on("disconnect", leaveVirtualSpace);
  socket.on("delete", endVirtualSpace);
  socket.on("send-message", sendMessageToChat);
  socket.on("update-user", updateUserDetails);

  /*

  Listeners

  1. updates - general updates e.g. when users join
  2. alerts - major alerts
  3. messages / private-messages - messages
  4. viewers - viewers attending virtual space 
  5. attributes - virtual space attributes
  6. timer - time limit
  7. me - my data

  */

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

  function createVirtualSpace({ description }) {
   VirtualSpace.create({
    creator_id: socket.id,
    description,
    username: VirtualSpace.attendee.username,
    user_theme: VirtualSpace.attendee.color,
   })
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
       message: `Metaverse room was ended by host`,
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

     endVirtualSpace();
    })
    .catch((err) => errorHandler(err, socket));
  }

  function sendMessageToChat({ message }) {
   const Message = require("../services/message");
   VirtualSpace.chat.add(
    new Message(message, { sender: VirtualSpace.attendee })
   );
  }

  function updateAttributes({ description }) {
   if (User.socket_id === VirtualSpace.creator_id) {
    VirtualSpace.updateAttributes({ description })
     .then((virtual_space) => {
      // Others
      NameSpace.to(VirtualSpace._id).emit("alerts", {
       message: "Metaverse caption has changed",
       type: "info",
      });
      NameSpace.to(VirtualSpace._id).emit("attributes", { virtual_space });
     })
     .catch((err) => errorHandler(err, socket));
   }
  }

  function updateUserDetails({ username, theme }) {
   if (username !== VirtualSpace.attendee.username) {
    let current_username = VirtualSpace.attendee.username;
    VirtualSpace.attendee.username = username;
    NameSpace.to(VirtualSpace._id).emit("updates", {
     message: `${current_username} has changed their username to ${VirtualSpace.attendee.username}`,
    });
   }

   if (theme) {
    VirtualSpace.attendee.color = theme;
   }
  }
 });
};
