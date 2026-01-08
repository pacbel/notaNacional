describe('Testes de Relatórios', () => {
  beforeEach(() => {
    cy.fixture('usuario').then((usuario) => {
      cy.fazerLogin(usuario.admin.username, usuario.admin.password);
    });
  });

  const verificarResultadoRelatorio = () => {
    // Aguarda um tempo para o relatório carregar ou download iniciar (ajustar conforme necessário)
    // cy.wait(2000); 
    cy.get('body').should('not.contain', 'Erro interno do servidor');
    cy.get('body').should('not.contain', 'Ocorreu um erro');
    // Se o relatório for exibido em uma área específica:
    // cy.get('#area-resultados-relatorio').should('be.visible').and('not.be.empty');
    // Se houver uma tabela de resultados:
    // cy.get('#tabela-resultados-relatorio tbody tr').should('have.length.greaterThan', 0);
    // Por agora, focamos em não ter erros explícitos e que o botão foi clicado.
    // A MEMORY[1bfb07c1-c32a-4c28-8acb-7ebf5699a039] sugere verificações básicas de resultado.
    // Uma verificação simples é que a URL não mudou para uma página de erro.
    cy.url().should('not.include', '/erro'); 
  };

  it('Deve acessar o relatório de tomadores', () => {
    cy.irPara('/relatorios/tomadores');
    cy.title().should('eq', 'NFS-e - Relatório de Tomadores');
    cy.get('form').should('exist');
    cy.get('button').contains('Visualizar').should('exist');
  });

  it('Deve acessar o relatório de serviços', () => {
    cy.irPara('/relatorios/servicos');
    cy.title().should('eq', 'NFS-e - Relatório de Serviços');
    cy.get('form').should('exist');
    cy.get('button').contains('Visualizar').should('exist');
  });

  it('Deve acessar o relatório de notas fiscais', () => {
    cy.irPara('/relatorios/notasFiscais');
    cy.title().should('eq', 'NFS-e - Relatório de Notas Fiscais');
    cy.get('form').should('exist');
    cy.get('button').contains('Visualizar').should('exist');
  });

  it('Deve acessar o relatório de logs', () => {
    cy.irPara('/relatorios/logs');
    cy.title().should('eq', 'NFS-e - Relatório de Logs');
    cy.get('form').should('exist');
    cy.get('button').contains('Visualizar').should('exist');
  });

  it('Deve acessar o relatório de usuários', () => {
    cy.irPara('/relatorios/usuarios');
    cy.title().should('eq', 'NFS-e - Relatório de Usuários');
    cy.get('form').should('exist');
    cy.get('button').contains('Visualizar').should('exist');
  });

  it('Deve testar filtros no relatório de tomadores', () => {
    cy.irPara('/relatorios/tomadores');
    cy.title().should('eq', 'NFS-e - Relatório de Tomadores');
    
    cy.get('input[name="nome"]').type('Tomador Teste');
    cy.get('input[name="cpfCnpj"]').type('00000000000191');
    cy.get('input[name="dataInicio"]').type('2023-01-01');
    cy.get('input[name="dataFim"]').type('2023-12-31');
    
    cy.get('button').contains('Visualizar').should('not.be.disabled').click();
    verificarResultadoRelatorio();
  });

  it('Deve testar filtros no relatório de serviços', () => {
    cy.irPara('/relatorios/servicos');
    cy.title().should('eq', 'NFS-e - Relatório de Serviços');

    cy.get('input[name="codigo"]').type('01.07'); // Exemplo de código de serviço
    cy.get('input[name="descricao"]').type('Suporte técnico');
    cy.get('input[name="dataInicio"]').type('2023-01-01');
    cy.get('input[name="dataFim"]').type('2023-12-31');
    
    cy.get('button').contains('Visualizar').should('not.be.disabled').click();
    verificarResultadoRelatorio();
  });

  it('Deve testar filtros no relatório de notas fiscais', () => {
    cy.irPara('/relatorios/notasFiscais');
    cy.title().should('eq', 'NFS-e - Relatório de Notas Fiscais');

    cy.get('input[name="numero"]').type('1');
    cy.get('select[name="status"]').select('AUTORIZADA'); // Usar o valor textual ou o value do option
    cy.get('input[name="dataInicio"]').type('2023-01-01');
    cy.get('input[name="dataFim"]').type('2023-12-31');
    
    cy.get('button').contains('Visualizar').should('not.be.disabled').click();
    verificarResultadoRelatorio();
  });

  it('Deve testar filtros no relatório de logs', () => {
    cy.irPara('/relatorios/logs');
    cy.title().should('eq', 'NFS-e - Relatório de Logs');

    cy.get('select[name="acao"]').select('CREATE'); 
    cy.get('select[name="entidade"]').select('PRESTADOR');
    cy.get('input[name="dataInicio"]').type('2023-01-01');
    cy.get('input[name="dataFim"]').type('2023-12-31');
    
    cy.get('button').contains('Visualizar').should('not.be.disabled').click();
    verificarResultadoRelatorio();
  });

  it('Deve testar validação de datas nos filtros do relatório de tomadores', () => {
    cy.irPara('/relatorios/tomadores');
    cy.title().should('eq', 'NFS-e - Relatório de Tomadores');
    
    cy.get('input[name="dataInicio"]').type('2025-05-30');
    cy.get('input[name="dataFim"]').type('2025-05-29');
    
    cy.get('button').contains('Visualizar').click();
    // Tentar um seletor mais específico para a mensagem de erro, se disponível
    cy.get('form .invalid-feedback, form .text-danger, [data-cy=date-error-message]').should('contain', 'Data de início não pode ser maior que a data de fim');
    
    cy.get('input[name="dataInicio"]').clear().type('2025-05-01');
    cy.get('input[name="dataFim"]').clear().type('2025-05-29');
    
    // A mensagem de erro deve sumir (ou o botão de visualizar ser clicável e não mostrar erro)
    cy.get('form .invalid-feedback, form .text-danger, [data-cy=date-error-message]').should('not.exist');
    // Ou, se a mensagem some e o botão fica habilitado:
    // cy.get('button').contains('Visualizar').should('not.be.disabled');
  });
});

