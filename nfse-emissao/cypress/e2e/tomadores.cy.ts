describe('Testes de Tomadores', () => {
  beforeEach(() => {
    cy.fixture('usuario').then((usuario) => {
      cy.fazerLogin(usuario.admin.username, usuario.admin.password);
    });
    cy.irPara('/tomadores');
  });

  it('Deve exibir a página de listagem de tomadores', () => {
    cy.log(document.title); // LOG PARA VERIFICAR TÍTULO
    cy.verificarTitulo('Tomadores');
    cy.get('table').should('exist');
    cy.get('a[href="/tomadores/novo"]').should('exist');
  });

  it('Deve navegar para o formulário de novo tomador', () => {
    cy.get('a[href="/tomadores/novo"]').click();
    cy.log(document.title); // LOG PARA VERIFICAR TÍTULO
    cy.verificarTitulo('Novo Tomador');
    cy.get('form').should('exist');
  });

  it('Deve validar campos obrigatórios e selects customizados na criação de tomador', () => {
    cy.get('a[href="/tomadores/novo"]').click();
    // Limpa todos os campos obrigatórios
    cy.get('input[name="razaoSocial"]').clear();
    cy.get('input[name="cnpj"]').clear();
    cy.get('input[name="email"]').clear();
    cy.get('button[type="submit"]').click();
    // Mensagens customizadas
    cy.get('form').should('contain', 'Razão Social é obrigatória');
    cy.get('form').should('contain', 'CNPJ é obrigatório');
    cy.get('form').should('contain', 'E-mail é obrigatório');
    // Se houver validação nativa
    // cy.get('input[name="razaoSocial"]').then($el => {
    //   expect($el[0].validationMessage).to.be.ok;
    // });
    // Teste para select customizado (se houver)
    cy.get('select[name="endereco.uf"]').select(''); // Tenta selecionar vazio
    cy.get('button[type="submit"]').click();
    cy.get('form').should('contain', 'UF é obrigatória');
  });

  it('Deve criar um novo tomador com sucesso', () => {
    cy.get('a[href="/tomadores/novo"]').click();
    
    cy.fixture('tomador').then((tomador) => {
      // Preencher dados básicos
      cy.get('input[name="razaoSocial"]').type(tomador.novo.razaoSocial);
      cy.get('input[name="nomeFantasia"]').type(tomador.novo.nomeFantasia);
      cy.get('input[name="cnpj"]').type(tomador.novo.cnpj);
      cy.get('input[name="inscricaoMunicipal"]').type(tomador.novo.inscricaoMunicipal);
      cy.get('input[name="email"]').type(tomador.novo.email);
      cy.get('input[name="telefone"]').type(tomador.novo.telefone);
      
      // Preencher endereço
      cy.get('input[name="endereco.logradouro"]').type(tomador.novo.endereco.logradouro);
      cy.get('input[name="endereco.numero"]').type(tomador.novo.endereco.numero);
      cy.get('input[name="endereco.complemento"]').type(tomador.novo.endereco.complemento);
      cy.get('input[name="endereco.bairro"]').type(tomador.novo.endereco.bairro);
      cy.get('input[name="endereco.cep"]').type(tomador.novo.endereco.cep);
      
      // Selecionar UF e Município
      cy.get('select[name="endereco.uf"]').select(tomador.novo.endereco.uf);
      // Aguardar carregamento dos municípios verificando se o select de municípios tem opções e está habilitado
      cy.get('select[name="endereco.codigoMunicipio"]').should('not.be.disabled');
      cy.get('select[name="endereco.codigoMunicipio"] option').should('have.length.gt', 1); // Garante que há mais que a opção padrão "Selecione"
      cy.get('select[name="endereco.codigoMunicipio"]').select(tomador.novo.endereco.codigoMunicipio);
      
      // Enviar formulário
      cy.get('button[type="submit"]').click();
      
      // Verificar sucesso
      cy.get('body').should('contain', 'Tomador criado com sucesso');
      cy.url().should('include', '/tomadores');
    });
  });

  it('Deve editar um tomador existente', () => {
    // Clicar na ação de edição do primeiro tomador da lista
    cy.get('table tbody tr').first().find('a[href*="/tomadores/editar/"]').click();
    
    // Verificar se está na página de edição
    cy.log(document.title); // LOG PARA VERIFICAR TÍTULO
    cy.verificarTitulo('Editar Tomador');
    
    // Alterar alguns campos
    cy.get('input[name="telefone"]').clear().type('11966666666');
    cy.get('input[name="email"]').clear().type('tomador_editado@cypress.com');
    
    // Enviar formulário
    cy.get('button[type="submit"]').click();
    
    // Verificar sucesso
    cy.get('body').should('contain', 'Tomador atualizado com sucesso');
    cy.url().should('include', '/tomadores');
  });

  it('Deve testar filtros na listagem de tomadores', () => {
    // Testar filtro por CNPJ
    cy.fixture('tomador').then((tomador) => {
      cy.get('input[placeholder*="CNPJ"]').type(tomador.novo.cnpj);
      cy.get('button[type="submit"]').click();
      cy.get('table tbody tr').should('have.length.at.least', 1);
      cy.get('table tbody').should('contain', tomador.novo.cnpj);
      
      // Limpar filtro
      cy.get('button[type="reset"]').click();
      
      // Testar filtro por Razão Social
      cy.get('input[placeholder*="Razão Social"]').type(tomador.novo.razaoSocial);
      cy.get('button[type="submit"]').click();
      cy.get('table tbody tr').should('have.length.at.least', 1);
      cy.get('table tbody').should('contain', tomador.novo.razaoSocial);
    });
  });

  it('Deve testar a inativação de um tomador', () => {
    // Clicar na ação de inativar do primeiro tomador da lista
    cy.get('table tbody tr').first().find('button[aria-label="Inativar"]').click();
    
    // Confirmar inativação
    cy.get('button').contains('Confirmar').click();
    
    // Verificar sucesso
    cy.get('body').should('contain', 'Tomador inativado com sucesso');
    
    // Verificar filtro de status
    cy.get('select[name="status"]').select('Inativos');
    cy.get('button[type="submit"]').click();
    cy.get('table tbody tr').first().should('contain', 'Inativo');
  });

  it('Deve testar a validação de formato de CNPJ', () => {
    cy.get('a[href="/tomadores/novo"]').click();
    
    // Testar CNPJ inválido
    cy.get('input[name="cnpj"]').type('12345');
    cy.get('button[type="submit"]').click();
    cy.get('form').should('contain', 'CNPJ inválido');
    
    // Testar CNPJ válido
    cy.get('input[name="cnpj"]').clear().type('34110865000190');
    cy.get('button[type="submit"]').click();
    cy.get('form').should('not.contain', 'CNPJ inválido');
  });
});
