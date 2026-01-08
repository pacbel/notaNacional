describe('Execução de Todos os Testes', () => {
  it('Deve executar todos os testes em sequência', () => {
    // Testes de Login
    cy.fixture('usuario').then((usuario) => {
      cy.fazerLogin(usuario.admin.username, usuario.admin.password);
    });

    // Testes de Dashboard
    cy.verificarTitulo('Dashboard');
    cy.get('.dashboard-card').should('exist');

    // Testes de Prestadores
    cy.irPara('/prestadores');
    cy.verificarTitulo('Prestadores');
    cy.get('table').should('exist');

    // Testes de Tomadores
    cy.irPara('/tomadores');
    cy.verificarTitulo('Tomadores');
    cy.get('table').should('exist');

    // Testes de Serviços
    cy.irPara('/servicos');
    cy.verificarTitulo('Serviços');
    cy.get('table').should('exist');

    // Testes de Emissão de NFSe
    cy.irPara('/nfse/emitir');
    cy.verificarTitulo('Emitir NFSe');
    cy.get('form').should('exist');

    // Testes de Relatórios
    cy.irPara('/relatorios/tomadores');
    cy.verificarTitulo('Relatório de Tomadores');
    cy.get('form').should('exist');
    
    cy.irPara('/relatorios/servicos');
    cy.verificarTitulo('Relatório de Serviços');
    cy.get('form').should('exist');
    
    cy.irPara('/relatorios/notas-fiscais');
    cy.verificarTitulo('Relatório de Notas Fiscais');
    cy.get('form').should('exist');
    
    cy.irPara('/relatorios/logs');
    cy.verificarTitulo('Relatório de Logs');
    cy.get('form').should('exist');
    
    cy.irPara('/relatorios/usuarios');
    cy.verificarTitulo('Relatório de Usuários');
    cy.get('form').should('exist');

    // Teste de Logout
    cy.get('button[aria-label="Perfil"]').click();
    cy.contains('Sair').click();
    cy.url().should('include', '/login');
  });
});
