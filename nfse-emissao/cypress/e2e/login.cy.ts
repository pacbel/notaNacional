describe('Testes de Login', () => {
  beforeEach(() => {
    // Garante que a página de login seja visitada antes de cada teste.
    // Se a página estiver em branco (conforme MEMORY[a354e096-3352-440c-b0d4-669325610d29]),
    // os testes que dependem de elementos da página falharão, o que é esperado.
    cy.visit('/login');
  });

  it('Deve exibir a página de login corretamente', () => {
    // Verifica o título da página HTML. Ajuste 'NFS-e - Login' se o título real for diferente.
    cy.title().should('eq', 'Login - Sistema de Emissão de NFS-e');
    cy.get('input[name="username"]').should('be.visible'); // Garante que está visível
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('Deve validar campos obrigatórios ao tentar submeter formulário vazio', () => {
    cy.get('button[type="submit"]').click();
    // Mensagens de erro customizadas são exibidas em uma lista dentro de um bloco de erro
    cy.get('.mb-4.bg-red-100').should('be.visible');
    cy.get('.mb-4.bg-red-100 li').should('contain', 'Usuário é obrigatório');
    cy.get('.mb-4.bg-red-100 li').should('contain', 'Senha é obrigatória');
  });

  it('Deve exibir mensagem de erro para credenciais inválidas', () => {
    cy.get('input[name="username"]').type('usuario_invalido');
    cy.get('input[name="password"]').type('senha_invalida');
    cy.get('button[type="submit"]').click();
    cy.get('.mb-4.bg-red-100 li').should('contain', 'Credenciais inválidas');
  });

  it('Deve realizar login com sucesso com credenciais de admin', () => {
    cy.fixture('usuario').then((usuario) => {
      cy.fazerLogin(usuario.admin.username, usuario.admin.password);
      // Verifica se foi redirecionado para o dashboard
      cy.url().should('include', '/dashboard');
      // Exemplo: verificar mensagem de boas-vindas ou outro elemento do dashboard
      // cy.get('[data-testid="dashboard-welcome-message"]').should('be.visible');
    });
  });

  it('Deve respeitar o limite máximo de caracteres para o campo username', () => {
    const stringMuitoLonga = 'abcdefghij_klmno'; // 18 caracteres
    const stringEsperada = 'abcdefghij'; // 10 caracteres
    cy.get('input[name="username"]').type(stringMuitoLonga);
    cy.get('input[name="username"]').should('have.value', stringEsperada);
  });
});
