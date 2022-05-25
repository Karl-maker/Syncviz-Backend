const User = require("./user");
const Chat = require("./chat");
const { fetchSocketOrganizer } = require("../utils/socket");
const VirtualSpaceModel = require("../models/virtual-space");
const Blob = require("./blob");
const schedule = require("node-schedule");

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
  this._blob = new Blob({});
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
 }

 get description() {
  return this._description;
 }

 set description(description) {
  this._description = description;
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

 get blob() {
  return this._blob;
 }

 set blob(blob) {
  this._blob = blob;
 }

 async join(id) {
  // return message
  // Do database actions first..
  let virtual_space = {};

  try {
   virtual_space = await VirtualSpaceModel.findOne({ _id: id });
  } catch (err) {
   throw err;
  }

  // Check if exists

  if (!virtual_space) {
   throw { name: "NotFound", message: "Virtual space isn't found" };
  }

  if (virtual_space.current_amount_attending < virtual_space.attendant_limit) {
   // Socket operations
   this._id = id;
   this._name = virtual_space.name;
   this._description = virtual_space.description;
   this._time_limit = virtual_space.time_limit;

   this._socket.join(id);

   virtual_space = await VirtualSpaceModel.findOneAndUpdate(
    { _id: id },
    { $inc: { current_amount_attending: 1 } },
    { new: true }
   );

   // Initialize Chat

   this.initializeChat();

   return { message: "Joined Virtual Space", virtual_space };
  } else {
   throw { name: "Forbidden", message: "Virtual Space is full" };
  }
 }

 async kick(user_id) {}

 async getSocketClients(room) {
  let result = fetchSocketOrganizer(await room.fetchSockets());
  return result;
 }

 async leave() {
  await VirtualSpaceModel.findOneAndUpdate(
   { _id: this._id },
   { $inc: { current_amount_attending: -1 } }
  );
  this._socket.leave(this._id);
 }

 async end() {
  try {
   await VirtualSpaceModel.findOneAndDelete({ _id: this._id });
  } catch (err) {
   throw { err };
  }
 }

 async fetch() {
  this._socket.emit("attributes", {
   id: this._id,
   name: this._name,
   description: this._description,
  });
 }

 async delete() {
  // If the creator leaves..
  this._vs.disconnectSockets();
 }

 async create({ creator_id, name, description }) {
  // Creation Logic
  try {
   let virtual_space = await VirtualSpaceModel.create({
    host: creator_id,
    name,
    description,
   });

   this._name = virtual_space.name;
   this._description = virtual_space.description;
   this._creator_id = creator_id;
   this._time_limit = virtual_space.time_limit;

   return {
    message: "Virtual Space created",
    virtual_space: virtual_space,
   };
  } catch (err) {
   throw err;
  }
 }

 initializeChat() {
  this._chat = new Chat({
   vs_id: this._id,
   socket: this._socket,
  });
 }

 async time(room) {
  // shedule an end where they all disconnect
  let i = 0;
  const timer = setInterval(() => {
   i++;
   trackTimer(i);
  }, 60000);

  const trackTimer = (minutes) => {
   if (minutes < this._time_limit) {
    // running
    room.emit("timer", {
     time_left: `${this._time_limit - minutes} ${
      this._time_limit - minutes === 1 ? "minute" : "minutes"
     }`,
    });
   }

   if (minutes >= this._time_limit) {
    // finished

    this.end()
     .then(() =>
      room.emit("alerts", {
       message: `Virtual space has closed`,
      })
     )
     .then(() => {
      clearInterval(timer);
      room.disconnectSockets();
     })
     .catch((err) => {
      throw err;
     });
   }

   if (this._time_limit - minutes === 1) {
    room.emit("timer", { prompt: "Meeting will end in 1 minute" });
   }
  };
 }
}

module.exports = VirtualSpace;
