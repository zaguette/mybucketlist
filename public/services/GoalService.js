// GoalService - gerencia metas por usuário, armazena em localStorage
class GoalService {
  constructor() {
    this.storageKey = 'goals';
    this.goals = this.loadGoals();
  }

  loadGoals() {
    const raw = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return raw.map(g => Meta.fromJSON(g));
  }

  saveGoals() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.goals.map(g => g.toJSON())));
  }

  getByUser(userId) {
    return this.goals.filter(g => g.userId === userId).map(g => Meta.fromJSON(g.toJSON()));
  }

  getById(id, userId) {
    return this.goals.find(x => x.id === id && x.userId === userId) || null;
  }

  addGoal(userId, titulo, descricao, fotos = [], icon = '⭐', color = '#ffffff') {
    const id = Date.now();
    const meta = new Meta(id, titulo, descricao, null, fotos, [], false, icon, color, null, null, userId);
    this.goals.push(meta);
    this.saveGoals();
    return meta;
  }

  editGoal(id, userId, updates = {}) {
    const g = this.goals.find(x => x.id === id && x.userId === userId);
    if (!g) throw new Error('Meta não encontrada');
    g.editarCampos(updates);
    this.saveGoals();
    return Meta.fromJSON(g);
  }

  toggleComplete(id, userId) {
    const g = this.goals.find(x => x.id === id && x.userId === userId);
    if (!g) throw new Error('Meta não encontrada');
    g.concluida = !g.concluida;
    if (g.concluida) g.data = new Date().toISOString();
    g.updatedAt = new Date().toISOString();
    this.saveGoals();
    return Meta.fromJSON(g);
  }

  setCompletionDate(id, userId, dateISO) {
    const g = this.goals.find(x => x.id === id && x.userId === userId);
    if (!g) throw new Error('Meta não encontrada');
    g.data = dateISO;
    g.concluida = !!dateISO;
    g.updatedAt = new Date().toISOString();
    this.saveGoals();
    return Meta.fromJSON(g);
  }

  addPhotoToGoal(id, userId, photoUrl) {
    const g = this.goals.find(x => x.id === id && x.userId === userId);
    if (!g) throw new Error('Meta não encontrada');
    g.fotos = g.fotos || [];
    g.fotos.push(photoUrl);
    g.updatedAt = new Date().toISOString();
    this.saveGoals();
    return Meta.fromJSON(g);
  }

  deleteGoal(id, userId) {
    const idx = this.goals.findIndex(x => x.id === id && x.userId === userId);
    if (idx === -1) throw new Error('Meta não encontrada');
    this.goals.splice(idx, 1);
    this.saveGoals();
  }
}

if (typeof module !== 'undefined') module.exports = GoalService;
