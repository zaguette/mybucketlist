// Classe Meta (versão para models)
// Representa uma meta da Bucket List com fotos, notas, estado de conclusão,
// ícone e cor para diferenciação visual.
class Meta {
  constructor(id, titulo, descricao = "", data = null, fotos = [], notas = [], concluida = false, icon = "⭐", color = "#ffffff", createdAt = null, updatedAt = null, userId = null) {
    this.id = id;
    this.titulo = titulo;
    this.descricao = descricao;
    this.data = data; // data de quando foi concluída (ISO) ou prevista
    this.fotos = fotos; // array de strings (URLs ou dataURLs)
    this.notas = notas; // array de objetos Note {texto, data}
    this.concluida = concluida;
    this.icon = icon;   // string (emoji ou classname)
    this.color = color; // hex color para destacar cartão
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.userId = userId; // id do usuário dono da meta
  }

  marcarComoFeita(completionDate = new Date().toISOString()) {
    this.concluida = true;
    this.data = completionDate;
    this.updatedAt = new Date().toISOString();
  }

  desmarcar() {
    this.concluida = false;
    this.updatedAt = new Date().toISOString();
  }

  adicionarFoto(url) {
    if (!url) return;
    this.fotos.push(url);
    this.updatedAt = new Date().toISOString();
  }

  adicionarNota(texto) {
    if (!texto) return;
    this.notas.push({ texto, data: new Date().toISOString() });
    this.updatedAt = new Date().toISOString();
  }

  editarCampos({ titulo, descricao, icon, color, dataConcluida }) {
    if (titulo !== undefined) this.titulo = titulo;
    if (descricao !== undefined) this.descricao = descricao;
    if (icon !== undefined) this.icon = icon;
    if (color !== undefined) this.color = color;
    if (dataConcluida !== undefined) {
      this.data = dataConcluida;
      this.concluida = !!dataConcluida;
    }
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    // garante serialização limpa para localStorage
    return {
      id: this.id,
      titulo: this.titulo,
      descricao: this.descricao,
      data: this.data,
      fotos: this.fotos,
      notas: this.notas,
      concluida: this.concluida,
      icon: this.icon,
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      userId: this.userId
    };
  }

  static fromJSON(obj) {
    if (!obj) return null;
    return new Meta(
      obj.id,
      obj.titulo,
      obj.descricao,
      obj.data,
      obj.fotos || [],
      obj.notas || [],
      obj.concluida || false,
      obj.icon || '⭐',
      obj.color || '#ffffff',
      obj.createdAt || null,
      obj.updatedAt || null,
      obj.userId || null
    );
  }
}

// export para ambientes que suportem módulos
if (typeof module !== 'undefined') module.exports = Meta;
