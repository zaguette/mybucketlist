1. Frontend
Framework: Next.js (React)


Versão: 14.x (App Router)


Justificativa:
 Next.js oferece renderização híbrida (SSR e SSG), performance otimizada e facilidade de roteamento.
 É ideal para criar interfaces modernas e responsivas, além de simplificar o deploy em plataformas como Vercel.
 Também permite integrar API e front-end no mesmo projeto, reduzindo complexidade.



2. Backend / API
Tecnologia: API Routes do Next.js (Node.js + Express integrado)


Linguagem: JavaScript (ES6+)


Funções principais:


CRUD de metas (/api/goals)


Upload de imagem (armazenamento local ou Cloudinary)


Autenticação simples por usuário (JWT)


Justificativa:
 Usar as rotas internas do Next.js elimina a necessidade de backend separado, facilitando deploy e manutenção.



3. Banco de Dados
SGBD: MySQL


Biblioteca ORM: Prisma ORM


Estrutura:

 Tabela users (
  id INT PK,
  nome VARCHAR(100),
  email VARCHAR(100)
)

Tabela goals (
  id INT PK,
  titulo VARCHAR(100),
  descricao TEXT,
  data DATE,
  status ENUM('a fazer','concluido'),
  foto_url TEXT,
  user_id INT FK
)


Justificativa:
 MySQL é leve, amplamente suportado e ideal para projetos educativos.
 Prisma simplifica o mapeamento objeto-relacional, gera migrações automáticas e aplica conceitos de POO no acesso a dados.



4. Arquitetura e POO
Organização do código:


/models → classes User, Goal (representam entidades)


/services → classes GoalService, UserService (regras de negócio)


/api → rotas Next.js que chamam os serviços


/components → componentes React reutilizáveis (botões, cards)


Princípios de POO aplicados:


Encapsulamento: classes isolam lógica interna


Abstração: serviços escondem detalhes do banco


Responsabilidade única: cada classe tem apenas uma função


Inversão de controle (IoC): Prisma e Next.js cuidam da injeção de dependências automaticamente



5. Deploy
Plataforma: Vercel


Justificativa:
 É a plataforma oficial para Next.js, com deploy contínuo integrado ao GitHub.
 Permite gerar um link público (ex: mybucketlist.vercel.app) que atualiza automaticamente a cada merge na branch main.



6. CI/CD
Ferramenta: GitHub Actions


Pipeline básico:


Rodar npm install


Rodar npm run lint


Rodar npm run build


Deploy automático para Vercel após merge


Objetivo:
 Garantir que o código estável da branch main seja testado e publicado automaticamente.



7. Testes
Biblioteca: Jest / React Testing Library


Abordagem:


Testar componentes principais (ex: formulário de meta)


Testar funções de serviço (ex: GoalService.addGoal())


Justificativa:
 Garante qualidade e funcionamento do CRUD principal.



8. Controle de Versão / Branches
Repositório: GitHub


Fluxo de trabalho (Git Flow simplificado):


main → versão em produção (deploy automático)


dev → integração de features


feature/<nome> → novas funcionalidades


Cada PR será revisado e deve conter explicação de POO e banco de dados (auditado pela IA)



9. Riscos e Mitigações
Risco
Mitigação
Falhas no deploy
Usar logs da Vercel e CI
Erros de conexão MySQL
Variáveis de ambiente seguras (.env)
Vazamento de dados
Nunca versionar credenciais
Dependência da IA
Revisar todo o código e pedir explicações detalhadas ao Copilot


10. Stack Resumido
Camada
Tecnologia
Justificativa
Frontend
Next.js (React)
Interface moderna e SSR
Backend
API Routes (Node.js)
Simples e integrado
Banco
MySQL + Prisma
Banco relacional leve
Deploy
Vercel
Integração direta
CI/CD
GitHub Actions
Teste + build automáticos
ORM
Prisma
POO e migrações simples

