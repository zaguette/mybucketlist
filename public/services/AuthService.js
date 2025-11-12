// AuthService simples usando localStorage e JWT simulado (sem criptografia real)
// Observação: em produção, NUNCA armazene senhas em texto e use bibliotecas seguras.
class AuthService {
  constructor() {
    this.storageKey = 'users';
    this.sessionKey = 'session';
    this.users = this.loadUsers();

    // Garantir que exista o usuário desenvolvedor/admin
    this._ensureDevUser();
  }

  loadUsers() {
    const raw = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return raw.map(u => User.fromJSON(u));
  }

  saveUsers() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.users.map(u => u.toJSON())));
  }

  // Simples hash (não seguro) só para demonstração
  _hash(password) {
    let h = 0;
    for (let i = 0; i < password.length; i++) {
      h = (h << 5) - h + password.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  // Garantir que exista um usuário desenvolvedor com credenciais conhecidas
  _ensureDevUser() {
    const DEV_EMAIL = 'laura.zaguette@eaportal.org';
    const DEV_PASSWORD = 'joaomylove';
    const exists = this.users.find(u => u.email === DEV_EMAIL);
    if (!exists) {
      const id = Date.now() - 1; // id previsível
      const user = new User(id, 'Desenvolvedora', DEV_EMAIL, this._hash(DEV_PASSWORD), true);
      this.users.push(user);
      this.saveUsers();
    }
  }

  register(nome, email, password) {
    if (this.users.find(u => u.email === email)) {
      throw new Error('Email já cadastrado');
    }
    const id = Date.now();
    const user = new User(id, nome, email, this._hash(password));
    this.users.push(user);
    this.saveUsers();
    this._setSession({ userId: id });
    return user;
  }

  login(email, password) {
    const hash = this._hash(password);
    const user = this.users.find(u => u.email === email && u.passwordHash === hash);
    if (!user) throw new Error('Credenciais inválidas');
    this._setSession({ userId: user.id });
    return user;
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
  }

  _setSession(sessionObj) {
    // Simula um token JWT curto
    const token = btoa(JSON.stringify(sessionObj));
    localStorage.setItem(this.sessionKey, token);
  }

  getSession() {
    const token = localStorage.getItem(this.sessionKey);
    if (!token) return null;
    try {
      return JSON.parse(atob(token));
    } catch (e) {
      return null;
    }
  }

  getCurrentUser() {
    const s = this.getSession();
    if (!s) return null;
    return this.users.find(u => u.id === s.userId) || null;
  }

  // Retorna todos os usuários (útil para área de desenvolvedor)
  getAllUsers() {
    return this.users.map(u => User.fromJSON(u.toJSON()));
  }
}

if (typeof module !== 'undefined') module.exports = AuthService;
