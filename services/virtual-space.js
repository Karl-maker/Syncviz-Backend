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
  }

  // Getters and Setters

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  async join() {}
  async kick(user_id) {}
  async leave() {}
  async fetch() {}
  async delete() {}
  async create() {}

  get() {
    return {
      name: this._name,
    };
  }
}

module.exports = VirtualSpace;
