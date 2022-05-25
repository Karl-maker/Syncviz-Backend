const User = require("../services/user");

function fetchSocketOrganizer(fetch) {
 let UserList = [];

 fetch.forEach((socket) => {
  UserList.push(
   new User({ socket_id: socket.id, username: socket.username }).get()
  );
 });

 return { users: UserList, amount: UserList.length };
}

module.exports = { fetchSocketOrganizer };
