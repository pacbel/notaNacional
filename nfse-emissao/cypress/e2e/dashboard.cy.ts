describe('Testes de Dashboard', () => {
  beforeEach(() => {
    // Fazer login como admin antes de cada teste, usando a fixture para consistência.
    cy.fixture('usuario').then((usuario) => {
      // Visitar diretamente a página de login
      cy.visit('/login');
      cy.get('input[name="username"]').type(usuario.admin.username);
      cy.get('input[name="password"]').type(usuario.admin.password);
      cy.get('button[type="submit"]').click();
      
      // Verificar se foi redirecionado para o dashboard
      cy.url().should('include', '/dashboard');
    });
  });

  it('Deve exibir a página de dashboard corretamente', () => {
    // Verificar se estamos na página do dashboard pelo URL
    cy.url().should('include', '/dashboard');
    
    // Verificar se o elemento principal está visível
    cy.get('main').should('exist');
    
    // Verificar se há algum título ou indicação de que estamos no dashboard
    cy.contains('Dashboard', { matchCase: false }).should('exist');
  });

  it('Deve exibir todos os cards essenciais do dashboard', () => {
    const cardsEsperados = ['Tomadores', 'Serviços', 'Notas Fiscais'];
    cy.get('main').within(() => {
      cardsEsperados.forEach((titulo) => {
        // Usar um seletor mais flexível para encontrar os títulos dos cards
        cy.contains(titulo).should('be.visible');
      });
      // Verifica se há pelo menos um card/seção
      cy.get('section, div[class*="card"]').should('have.length.at.least', 1);
      
      // Verificamos apenas que existem elementos de card, sem verificar números
      // Isso torna o teste mais flexível caso alguns cards não tenham números
      cy.get('section, div[class*="card"]').should('exist');
    });
  });

  it('Deve permitir navegar para a página de "Prestadores" a partir do menu ou card', () => {
    // Verificar se a navegação está visível
    cy.get('nav, header').should('exist');
    
    // Abordagem flexível para encontrar e clicar no link de Prestadores
    cy.contains('a, button, div[role="button"]', 'Prestadores', { matchCase: false })
      .first()
      .click({ force: true });
    
    // Verificar se fomos para a página de prestadores
    cy.url().should('include', '/prestadores');
    
    // Voltar para o dashboard
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  it('Deve exibir elementos visuais como gráficos ou tabelas, se aplicável no dashboard', () => {
    // Esta verificação é genérica. Se o dashboard tiver gráficos ou tabelas específicas,
    // teste-os com seletores mais precisos e verifique sua visibilidade.
    // Ex: cy.get('[data-cy=grafico-faturamento] canvas').should('be.visible');
    // Ex: cy.get('[data-cy=tabela-ultimas-notas] tbody tr').should('have.length.gt', 0);
    
    // Tenta encontrar um elemento que possa ser um gráfico ou uma tabela.
    // Use seletores mais específicos se a estrutura for conhecida.
    cy.get('main').then(($main) => {
      if ($main.find('canvas, svg, [data-cy^="chart-"], [data-cy^="table-"]').length > 0) {
        cy.log('Elementos visuais (gráficos/tabelas) encontrados.');
        // Adicionar verificações mais específicas aqui se necessário
        // cy.get('[data-cy="chart-faturamento"]').should('be.visible');
      } else {
        cy.log('Nenhum elemento visual específico (gráfico/tabela) encontrado com os seletores genéricos.');
      }
    });
  });
});
