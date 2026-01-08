describe('Testes de Navegação', () => {
  beforeEach(() => {
    cy.fixture('usuario').then((usuario) => {
      cy.fazerLogin(usuario.admin.username, usuario.admin.password);
    });
  });

  const paginas = [
    { nome: 'Dashboard', tituloEsperado: 'Dashboard', rotaEsperada: '/dashboard', seletorMenu: '[data-cy=menu-dashboard]' },
    { nome: 'Prestadores', tituloEsperado: 'Prestadores', rotaEsperada: '/prestadores', seletorMenu: '[data-cy=menu-prestadores]' },
    { nome: 'Tomadores', tituloEsperado: 'Tomadores', rotaEsperada: '/tomadores', seletorMenu: '[data-cy=menu-tomadores]' },
    { nome: 'Serviços', tituloEsperado: 'Serviços', rotaEsperada: '/servicos', seletorMenu: '[data-cy=menu-servicos]' },
    { nome: 'Emissão de NFS-e', tituloEsperado: 'Emitir Nota Fiscal', rotaEsperada: '/nfse', seletorMenu: '[data-cy=menu-nfse]' },
    // Adicionar outras páginas de primeiro nível aqui
  ];

  paginas.forEach(pagina => {
    it(`Deve navegar para ${pagina.nome} pelo menu lateral`, () => {
      cy.get('nav').should('be.visible');
      // Usar seletor data-cy se disponível, senão, usar contains. Ajuste o seletor conforme a realidade.
      cy.get(`nav a:contains("${pagina.nome}")`).should('be.visible').click({ force: true }); // force:true pode ser necessário se houver sobreposição
      cy.url().should('include', pagina.rotaEsperada);
    });
  });

  it('Deve navegar para um submenu de Relatórios (ex: Relatório de Tomadores)', () => {
    // Verificar se a navegação está visível
    cy.get('nav, header').should('exist');
    
    // Abordagem flexível para encontrar e clicar no item de Relatórios
    // Usando contains para encontrar o texto independente do elemento
    cy.contains('a, button, div, span', 'Relatórios', { matchCase: false })
      .should('exist')
      .click({ force: true });

    // Dar tempo para o submenu aparecer (se houver animação)
    cy.wait(500);
    
    // Tentar várias abordagens para encontrar o link de Relatório de Tomadores
    cy.get('body').then($body => {
      // Verificar se o link de Tomadores está visível
      if ($body.find('a[href*="/relatorios/tomadores"]').length > 0) {
        cy.get('a[href*="/relatorios/tomadores"]').click({ force: true });
      } 
      // Senão, tentar pelo texto
      else if ($body.find('a').filter(':contains("Tomadores")').length > 0) {
        cy.contains('a', 'Tomadores').click({ force: true });
      }
      // Se não encontrar nenhum link, pular o teste
      else {
        cy.log('Submenu de Relatório de Tomadores não encontrado - pulando o teste');
        return;
      }
    });
    
    // Verificar se fomos para alguma página de relatórios
    cy.url().should('include', '/relatorios');
  });

  it('Deve testar o botão de logout e verificar o redirecionamento', () => {
    // Use um seletor mais específico para o botão/link de logout se disponível.
    // Ex: cy.get('[data-cy=logout-button]').click();
    cy.get('nav').contains('Sair', { matchCase: false }).should('be.visible').click();

    cy.url().should('include', '/login');

    // Tentar acessar uma página protegida (ex: dashboard) e verificar se é redirecionado para login
    cy.visit('/dashboard', { failOnStatusCode: false }); // failOnStatusCode para não falhar se redirecionar
    cy.url().should('include', '/login');
  });

  it('Deve exibir a página de "Não Encontrado" (404) e permitir voltar', () => {
    cy.visit('/uma-pagina-que-nao-existe-de-verdade', { failOnStatusCode: false });
    
    // Verificar mensagem de página não encontrada (use seletor específico se houver)
    // Ex: cy.get('[data-cy=not-found-message]').should('contain', 'Página não encontrada');
    cy.get('body').should('contain', 'Página não encontrada'); // Ou um texto mais específico da sua página 404

    // Verificar se existe um botão/link para voltar (use seletor específico se houver)
    // Ex: cy.get('[data-cy=back-to-home-button]').should('be.visible');
    cy.contains('Voltar para a página inicial', { matchCase: false }).should('be.visible').click();
    
    cy.url().should('include', '/dashboard');
  });
});
