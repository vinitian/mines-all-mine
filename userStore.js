export default class InMemoryUserStore {
  constructor() {
    this.sessions = new Map();
  }

  findUser(id) {
    return this.sessions.get(id);
  }

  saveUser(id, session) {
    this.sessions.set(id, session);
  }

  findAllUsers() {
    return [...this.sessions.values()];
  }
}
