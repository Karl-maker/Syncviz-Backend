const VS = require("../services/virtual-space");
const wrapper = require("../middlewares/wrapper");
const constants = require("../constants");
const config = require("../config");
const VirtualSpace = require("../services/virtual-space");
const authenticate = require("../middlewares/authenticate");

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

  if (socket.handshake.query.vs_id) {
   VirtualSpace.id = socket.handshake.query.vs_id;
   VirtualSpace.vs = NameSpace.to(VirtualSpace.id);
   VirtualSpace.join({ id: socket.handshake.query.vs_id });
  } else {
   VirtualSpace.creator_id = User.socket_id;
   VirtualSpace.create();
   VirtualSpace.vs = NameSpace.to(VirtualSpace.id);
  }

  // Initialize chatroom

  VirtualSpace.initializeChat();

  // Events avaliable to users not connected to a vs

  socket.on("info", getVirtualSpace(VirtualSpace));
  socket.on("disconnect", leaveVirtualSpace(VirtualSpace));
  socket.on("send-message", sendMessageToChat(VirtualSpace));
  socket.on("kick", kickUserFromVirtualSpace(VirtualSpace));
 });
};

// Using functions so that the use of call and bind can be considered

function getVirtualSpace(VirtualSpace) {
 return async (args) => VirtualSpace.fetch();
}

function leaveVirtualSpace(VirtualSpace) {
 return (args) => VirtualSpace.leave();
}

function sendMessageToChat(VirtualSpace) {
 const Message = require("../services/message");
 return (args) =>
  VirtualSpace.chat.add(
   new Message(args.message, { sender: VirtualSpace.attendee })
  );
}

function kickUserFromVirtualSpace(VirtualSpace) {
 return ({ user_id }) => VirtualSpace.kick(user_id);
}
