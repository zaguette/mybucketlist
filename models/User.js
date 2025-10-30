// Classe User - representa um usuário da aplicação
// -------------------------------------------------
// Este arquivo contém explicações sobre os principais conceitos de
// Programação Orientada a Objetos (POO) aplicados nesta classe.
// Leia os comentários para entender o papel de cada componente.

class User {
  // O construtor é chamado quando criamos um novo User: new User(...)
  // Ele inicializa as propriedades que definem o estado do objeto.
  // Aqui usamos: id, nome, email, passwordHash e isDev (indicador de desenvolvedor/admin).
  constructor(id, nome, email, passwordHash, isDev = false) {
    // 'this' refere-se à instância atual (o objeto que está sendo criado)
    this.id = id;                // identificador único da entidade (inteiro ou timestamp)
    this.nome = nome;            // nome do usuário (string)
    this.email = email;          // email (string) — usado como credencial/login
    this.passwordHash = passwordHash; // hash da senha (não armazenar senha em texto puro)
    this.isDev = !!isDev;        // flag booleana para identificar o usuário desenvolvedora/admin

    // Observação sobre encapsulamento:
    // Em JavaScript puro os campos são públicos por padrão. Para encapsular
    // mais fortemente, poderíamos usar símbolos ou campos privados (#campo),
    // mas para simplicidade pedagógica mantemos propriedades públicas.
  }

  // toJSON()
  // ----------
  // Método de instância responsável por transformar o objeto em um
  // formato simples (POJO) adequado para serialização (ex: localStorage).
  // Este é um exemplo de abstração: consumidores do objeto não precisam
  // conhecer a estrutura interna, apenas chamam toJSON para obter um
  // objeto pronto para salvar.
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      passwordHash: this.passwordHash,
      isDev: this.isDev
    };
  }

  // fromJSON(obj)
  // --------------
  // Método estático que reconstrói uma instância de User a partir de
  // um objeto plano (por exemplo, o resultado de JSON.parse).
  // Uso de método estático é comum quando a operação cria uma nova
  // instância a partir de dados externos.
  static fromJSON(obj) {
    if (!obj) return null;
    // Ao recriar a instância, mantemos a responsabilidade da classe
    // de saber como interpretar os dados. Isso é abstração aplicada.
    return new User(obj.id, obj.nome, obj.email, obj.passwordHash, obj.isDev || false);
  }
}

// Export (compatível com ambientes CommonJS)
// Em aplicações front-end simples que carregam scripts via <script>,
// este bloco não afeta o funcionamento; é apenas para compatibilidade
// com bundlers/testes que usem require/module.exports.
if (typeof module !== 'undefined') module.exports = User;

// Principais anotações finais (guia rápido):
// - Encapsulamento: a classe agrupa os dados (id, nome, email) e os
//   comportamentos (toJSON, fromJSON) relacionados ao conceito de usuário.
// - Abstração: fornecemos métodos claros para salvar/carregar a entidade
//   sem expor detalhes de armazenamento (localStorage, banco, etc.).
// - Responsabilidade Única: esta classe não faz login, valida senhas ou
//   gerencia sessões — essas responsabilidades ficam em AuthService.
// - Evolução: se precisar de validações, podemos adicionar métodos como
//   validateEmail() ou changePassword(oldPass, newPass) mantendo a SRP.
