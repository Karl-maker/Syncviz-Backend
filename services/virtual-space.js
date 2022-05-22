class VirtualSpace {
  constructor({
    id,
    name,
    description,
    host,
    time_limit,
    attendant_limit,
    vs,
    socket,
  }) {
    this._id = id || "";
    this._name = name || "";
    this._description = description || "";
    this._time_limit = time_limit || 30;
    this._attendant_limit = attendant_limit || 5;
    this._vs = vs || null; // Namespace with room
    this._socket = socket || null;
  }

  // Getters and Setters

  async join() {}
  async kick(user_id) {}
  async leave() {}
  async fetch() {}
  async delete() {}
}

module.exports = VirtualSpace;
