class Message {
 constructor(message, { sender }) {
  this._message = message;
  this._sender = sender;
  this._timestamp = new Date();
 }

 get() {
  return {
   message: this._message,
   timestamp: this._timestamp,
   sender: {
    username: this._sender.username,
    id: this._sender.socket_id,
    color: this._sender.color,
   },
  };
 }
}

module.exports = Message;
