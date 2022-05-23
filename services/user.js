class User {
 constructor({ username, color, socket_id }) {
  this._username = username || "";
  this._color = color || "#0984e3";
  this._socket_id = socket_id || "";
  this._id = "";
 }

 get socket_id() {
  return this._socket_id;
 }

 set socket_id(socket_id) {
  this._socket_id = socket_id;
 }

 get username() {
  return this._username;
 }

 set username(username) {
  this._username = username;
 }
}

module.exports = User;
