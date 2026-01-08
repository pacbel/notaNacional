describe('Testes de Serviços', () => {
  beforeEach(() => {
    cy.fixture('usuario').then((usuario) => {
      cy.fazerLogin(usuario.admin.username, usuario.admin.password);
    });
    cy.irPara('/servicos');
    cy.title().should('eq', 'NFS-e - Serviços');
  });

  it('Deve exibir a página de listagem de serviços', () => {
    cy.get('table').should('exist');
    cy.get('a[href="/servicos/novo"]').should('exist');
  });

  it('Deve navegar para o formulário de novo serviço', () => {
    cy.get('a[href="/servicos/novo"]').click();
    cy.title().should('eq', 'NFS-e - Novo Serviço');
    cy.get('form').should('exist');
  });

  it('Deve validar campos obrigatórios e selects customizados na criação de serviço', () => {
    cy.get('a[href="/servicos/novo"]').click();
    cy.title().should('eq', 'NFS-e - Novo Serviço');
    // Limpa campos obrigatórios
    cy.get('input[name="descricao"]').clear();
    cy.get('input[name="valorUnitario"]').clear();
    cy.get('input[name="aliquota"]').clear();
    cy.get('button[type="submit"]').click();
    // Mensagens customizadas
    cy.get('form').should('contain', 'Descrição é obrigatória');
    cy.get('form').should('contain', 'Valor unitário é obrigatório');
    cy.get('form').should('contain', 'Alíquota é obrigatória');
    // Se houver validação nativa
    // cy.get('input[name="descricao"]').then($el => {
    //   expect($el[0].validationMessage).to.be.ok;
    // });
    // Teste para select customizado (se houver)
    cy.get('select[name="unidade"]').select(''); // Tenta selecionar vazio
    cy.get('button[type="submit"]').click();
    cy.get('form').should('contain', 'Unidade é obrigatória');
    cy.get('form').should('be.visible');
    cy.url().should('include', '/servicos/novo');
  });

  it('Deve criar um novo serviço com sucesso', () => {
    cy.get('a[href="/servicos/novo"]').click();
    cy.title().should('eq', 'NFS-e - Novo Serviço');

    cy.fixture('servico').then((servico) => {
      cy.get('input[name="codigo"]').type(servico.novo.codigo);
      cy.get('input[name="descricao"]').type(servico.novo.descricao);
      cy.get('input[name="itemListaServico"]').type(
        servico.novo.itemListaServico
      ); // Ou select, dependendo da implementação
      cy.get('input[name="codigoTributacaoMunicipio"]').type(
        servico.novo.codigoTributacaoMunicipio
      );
      cy.get('select[name="unidade"]').select(servico.novo.unidade); // Assumindo que unidade é um select
      cy.get('input[name="valorUnitario"]').type(servico.novo.valorUnitario);
      cy.get('input[name="aliquota"]').type(servico.novo.aliquota);

      cy.get('input[name="valorDeducoes"]').type(servico.novo.valorDeducoes);
      cy.get('input[name="descontoCondicionado"]').type(
        servico.novo.descontoCondicionado
      );
      cy.get('input[name="descontoIncondicionado"]').type(
        servico.novo.descontoIncondicionado
      );
      cy.get('input[name="valorPis"]').type(servico.novo.valorPis);
      cy.get('input[name="valorCofins"]').type(servico.novo.valorCofins);
      cy.get('input[name="valorInss"]').type(servico.novo.valorInss);
      cy.get('input[name="valorIr"]').type(servico.novo.valorIr);
      cy.get('input[name="valorCsll"]').type(servico.novo.valorCsll);
      cy.get('input[name="outrasRetencoes"]').type(
        servico.novo.outrasRetencoes
      );

      cy.get('button[type="submit"]').click();

      cy.get('.toast-success, body').should(
        'contain',
        'Serviço criado com sucesso'
      );
      cy.url().should('include', '/servicos').and('not.include', '/novo');
      cy.title().should('eq', 'NFS-e - Serviços');
    });
  });

  it('Deve editar um serviço existente', () => {
    cy.fixture('servico').then((servico) => {
      // Clicar no botão de editar do primeiro serviço da lista
      // Idealmente, buscar pelo código do serviço criado no teste anterior ou um serviço conhecido
      cy.get('table tbody tr').first().find('a[href*="/servicos/"]').click();
      cy.title().should('eq', 'NFS-e - Editar Serviço');

      cy.get('input[name="descricao"]').clear().type(servico.edicao.descricao);
      cy.get('input[name="valorUnitario"]')
        .clear()
        .type(servico.edicao.valorUnitario);
      cy.get('input[name="aliquota"]').clear().type(servico.edicao.aliquota);
      cy.get('select[name="unidade"]').select(servico.edicao.unidade);
      cy.get('input[name="valorDeducoes"]')
        .clear()
        .type(servico.edicao.valorDeducoes);
      cy.get('input[name="descontoCondicionado"]')
        .clear()
        .type(servico.edicao.descontoCondicionado);
      cy.get('input[name="valorPis"]').clear().type(servico.edicao.valorPis);

      cy.get('button[type="submit"]').click();

      cy.get('.toast-success, body').should(
        'contain',
        'Serviço atualizado com sucesso'
      );
      cy.url().should('include', '/servicos').and('not.include', '/editar');
      cy.title().should('eq', 'NFS-e - Serviços');
    });
  });

  it('Deve testar filtros na listagem de serviços', () => {
    cy.fixture('servico').then((servico) => {
      // Testar filtro por código
      cy.get('input[placeholder*="Código"]').type(servico.novo.codigo);
      cy.get('button[type="submit"]').contains('Filtrar').click();
      cy.get('table tbody tr').should('have.length.at.least', 1);
      cy.get('table tbody tr').first().should('contain', servico.novo.codigo);

      cy.get('button[type="reset"]').contains('Limpar').click();
      cy.get('input[placeholder*="Código"]').should('be.empty');

      // Testar filtro por descrição
      cy.get('input[placeholder*="Descrição"]').type(servico.novo.descricao);
      cy.get('button[type="submit"]').contains('Filtrar').click();
      cy.get('table tbody tr').should('have.length.at.least', 1);
      cy.get('table tbody tr')
        .first()
        .should('contain', servico.novo.descricao);
      cy.get('button[type="reset"]').contains('Limpar').click();
    });
  });

  it('Deve inativar um serviço e verificar status', () => {
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    cy.get('table tbody tr')
      .first()
      .find('td')
      .eq(0) // Assumindo que Código/Descrição é a primeira coluna visível para identificação
      .invoke('text')
      .then((identificadorServico) => {
        cy.get('table tbody tr')
          .first()
          .find('button[aria-label="Inativar"]')
          .click();
        cy.get('div[role="dialog"]')
          .should('be.visible')
          .find('button')
          .contains('Confirmar')
          .click();

        cy.get('.toast-success, body').should(
          'contain',
          'Serviço inativado com sucesso'
        );

        cy.get('select[name="status"]').select('INATIVO');
        cy.get('button[type="submit"]').contains('Filtrar').click();
        cy.get('table tbody tr').should('have.length.greaterThan', 0);
        cy.get('table tbody tr')
          .first()
          .should('contain', identificadorServico.trim())
          .and('contain', 'Inativo');
      });
  });

  it('Deve reativar um serviço e verificar status', () => {
    cy.get('select[name="status"]').select('INATIVO');
    cy.get('button[type="submit"]').contains('Filtrar').click();

    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    cy.get('table tbody tr')
      .first()
      .find('td')
      .eq(0)
      .invoke('text')
      .then((identificadorServico) => {
        cy.get('table tbody tr')
          .first()
          .find('button[aria-label="Reativar"]')
          .click();
        cy.get('div[role="dialog"]')
          .should('be.visible')
          .find('button')
          .contains('Confirmar')
          .click();

        cy.get('.toast-success, body').should(
          'contain',
          'Serviço reativado com sucesso'
        );

        cy.get('select[name="status"]').select('ATIVO');
        cy.get('button[type="submit"]').contains('Filtrar').click();
        // Filtrar pelo serviço específico para confirmar sua presença entre os ativos
        // cy.get('input[placeholder*="Descrição"]').type(identificadorServico.trim());
        // cy.get('button[type="submit"]').contains('Filtrar').click();
        cy.get('table tbody tr').should('have.length.greaterThan', 0);
        cy.get('table tbody tr')
          .first()
          .should('contain', identificadorServico.trim())
          .and('contain', 'Ativo');
      });
  });

  it('Deve testar a validação de formato de valores numéricos', () => {
    cy.get('a[href="/servicos/novo"]').click();
    cy.title().should('eq', 'NFS-e - Novo Serviço');

    cy.get('input[name="valorUnitario"]').type('texto');
    cy.get('button[type="submit"]').click(); // Tenta submeter para ver a validação
    cy.get('input[name="valorUnitario"]')
      .siblings('.invalid-feedback, .text-danger')
      .should('contain', 'Valor unitário inválido'); // Ajustar seletor da mensagem de erro

    cy.get('input[name="valorUnitario"]').clear().type('100,00');
    cy.get('input[name="valorUnitario"]')
      .siblings('.invalid-feedback, .text-danger')
      .should('not.exist');

    cy.get('input[name="aliquota"]').type('texto');
    cy.get('button[type="submit"]').click();
    cy.get('input[name="aliquota"]')
      .siblings('.invalid-feedback, .text-danger')
      .should('contain', 'Alíquota inválida');

    cy.get('input[name="aliquota"]').clear().type('5,00');
    cy.get('input[name="aliquota"]')
      .siblings('.invalid-feedback, .text-danger')
      .should('not.exist');
    // Não submeter o formulário completo aqui, apenas testar validações de campo
  });
});
