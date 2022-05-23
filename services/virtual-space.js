const User = require("./user");
const Chat = require("./chat");

class VirtualSpace {
 constructor({
  id,
  name,
  description,
  host,
  time_limit,
  attendant_limit,
  attendee,
  vs,
  socket,
 }) {
  this._id = id || "";
  this._name = name || "";
  this._description = description || "";
  this._time_limit = time_limit || 30;
  this._attendant_limit = attendant_limit || 5;
  this._creator_id = "";
  this._attendee = attendee || new User({});
  this._chat = null;
 }

 // Getters and Setters

 get id() {
  return this._id;
 }

 set id(id) {
  this._id = id;
 }

 get creator_id() {
  return this._creator_id;
 }

 set creator_id(creator_id) {
  this._creator_id = creator_id;
 }

 get name() {
  return this._name;
 }

 set name(name) {
  this._name = name;
  this._socket.broadcast.to(this._id).emit("updates", {
   message: `Virtual space name has changed to ${this._name}`,
  });
 }

 get description() {
  return this._description;
 }

 set description(description) {
  this._description = description;
  this._socket.broadcast.to(this._id).emit("updates", {
   message: `Virtual space description has changed to ${this._description}`,
  });
 }

 get vs() {
  return this._vs;
 }

 set vs(vs) {
  this._vs = vs;
 }

 get socket() {
  return this._socket;
 }

 set socket(socket) {
  this._socket = socket;
 }

 get attendee() {
  return this._attendee;
 }

 set attendee(attendee) {
  this._attendee = attendee;
 }

 get chat() {
  return this._chat;
 }

 set chat(chat) {
  this._chat = chat;
 }

 async join({ id }) {
  // Do database actions first..

  this._socket.join(id || this._id);
  this._socket.emit("updates", { message: "Joined virtual space" });
  this._socket.broadcast.to(this._id).emit("updates", {
   message: `${this._attendee.username || "guest"} has joined`,
  });
 }

 async kick(user_id) {
  this._vs.emit("updates", { action: "Kick", user_id });
 }

 async leave() {
  if (this._creator_id === this._attendee.socket_id) {
   // Creator has left...

   this._socket.broadcast.to(this._id).emit("updates", {
    message: `Virtual space has ended`,
   });

   // Clear room
   this._vs.disconnectSockets();
  } else {
   this._socket.broadcast.to(this._id).emit("updates", {
    message: `${this._attendee.username || "guest"} has left`,
   });
  }
 }

 async fetch() {
  this._socket.emit("virtual-space", {
   id: this._id,
   name: this._name,
   description: this._description,
  });
 }

 async delete() {
  // If the creator leaves..
  this._vs.disconnectSockets();
 }

 async create() {
  // Creation Logic
  this._id = "123";
  this.join({ id: this._id });
 }

 async initializeChat() {
  this._chat = new Chat({
   vs: this._vs,
   vs_id: this._id,
   socket: this._socket,
  });
 }
}

module.exports = VirtualSpace;
