class Message {
 constructor(message, { sender, private }) {
  this._message = message;
  this._sender = sender;
  this._timestamp = new Date();
  this._private = private || false;
 }

 get() {
  return {
   message: this._message,
   timestamp: this._timestamp,
   sender: { username: this._sender.username, id: this._sender.socket_id },
   private: this._private,
  };
 }
}

module.exports = Message;
