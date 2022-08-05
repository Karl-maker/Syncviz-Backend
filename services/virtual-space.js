const User = require("./user");
const Chat = require("./chat");
const { fetchSocketOrganizer } = require("../utils/socket");
const VirtualSpaceModel = require("../models/virtual-space");
const constants = require("../constants");

class VirtualSpace {
 constructor() {
  this._time_limit = 30;
  this._master = false;
  this._url = null;
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

 get description() {
  return this._description;
 }

 set description(description) {
  this._description = description;
 }

 get url() {
  return this._url;
 }

 set url(url) {
  this._url = url;
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

 get master() {
  return this._master;
 }

 set master(master) {
  this._master = master;
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
   throw { name: "NotFound", message: "Metaverse room isn't found" };
  }

  // Socket operations
  this._id = id;
  this._description = virtual_space.description;
  this._time_limit = virtual_space.time_limit;
  this._creator_id = virtual_space.host;
  this._url = virtual_space.url;

  this._socket.join(id);

  virtual_space = await VirtualSpaceModel.findOneAndUpdate(
   { _id: id },
   { $inc: { current_amount_attending: 1 } },
   { new: true }
  );

  // Initialize Chat

  this.initializeChat();

  return { message: "Joined Metaverse Room", virtual_space };
 }

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
   description: this._description,
   url: this._url,
  });
 }

 async updateAttributes({ description }) {
  try {
   const new_virtualspace = await VirtualSpaceModel.findOneAndUpdate(
    { _id: this._id },
    { description },
    { new: true }
   );

   this._description = new_virtualspace.description;
   return new_virtualspace;
  } catch (err) {
   throw { err };
  }
 }

 async create({ creator_id, description, username, user_theme }) {
  // Creation Logic
  try {
   let virtual_space = await VirtualSpaceModel.create({
    host: creator_id,
    user: { username, theme: user_theme },
    description,
   });

   this._description = virtual_space.description;
   this._creator_id = creator_id;
   this._time_limit = virtual_space.time_limit;
   this._master = true;
   this._url = virtual_space.url;

   return {
    message: "Metaverse room created",
    virtual_space: virtual_space,
   };
  } catch (err) {
   throw err;
  }
 }

 async time(room) {
  // shedule an end where they all disconnect
  let i = 0;
  const timer = setInterval(() => {
   i++;
   trackTimer(i);
  }, 60000);

  const trackTimer = (minutes) => {
   if (minutes >= this._time_limit) {
    // finished

    this.end()
     .then(() =>
      room.emit("alerts", {
       message: `Metaverse room has closed`,
      })
     )
     .then(() => {
      clearInterval(timer);
      room.disconnectSockets();
      this._socket.disconnect(true);
     })
     .catch((err) => {
      throw err;
     });
   }
  };
 }

 initializeChat() {
  this._chat = new Chat({
   vs_id: this._id,
   socket: this._socket,
  });
 }
}

module.exports = VirtualSpace;
