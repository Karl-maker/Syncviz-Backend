class Chat {
 constructor({ vs, socket, vs_id, sender }) {
  this._vs = vs || null;
  this._socket = socket || null;
  this._vs_id = vs_id || "";
 }

 add(message) {
  this._socket.broadcast.to(this._vs_id).emit("messages", message.get());
 }
}

module.exports = Chat;
