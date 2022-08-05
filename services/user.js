const colors = ["#00cec9", "#0984e3", "#ff7675", "#6c5ce7"];

class User {
 constructor({ username, color, socket_id }) {
  this._username = username || "";
  this._color = color || this.randomizeColor();
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
  return this._username || `guest ${this._socket_id}`;
 }

 set username(username) {
  this._username = username;
 }

 get color() {
  return this._color;
 }

 set color(color) {
  this._color = color;
 }

 randomizeColor() {
  return colors[Math.floor(Math.random() * colors.length)];
 }

 get() {
  return {
   id: this._id,
   socket_id: this._socket_id,
   username: this.username,
   color: this._color,
  };
 }
}

module.exports = User;
