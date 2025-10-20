// Classe Goal - representa um objetivo da Bucket List
// Aplicando conceitos de POO: encapsulamento, construtor e métodos

class Goal {
  constructor(title, description, date, photos = []) {
    this.title = title;
    this.description = description;
    this.date = date;
    this.photos = photos;
    this.completed = false;
  }

  // Marca o objetivo como concluído
  markAsCompleted() {
    this.completed = true;
  }

  // Adiciona uma foto à lista
  addPhoto(photoUrl) {
    this.photos.push(photoUrl);
  }

  // Exibe os detalhes do objetivo
  getDetails() {
    return `
      Título: ${this.title}
      Descrição: ${this.description}
      Data: ${this.date}
      Concluído: ${this.completed ? "Sim" : "Não"}
    `;
  }
}

// Exemplo de uso:
// const goal = new Goal("Viajar para o Japão", "Sonho de conhecer o Japão", "2026-05-15");
// goal.addPhoto("japao.jpg");
// goal.markAsCompleted();
// console.log(goal.getDetails());
