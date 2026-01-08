/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add("fillInput", (element, value) => {
  cy.wrap(element).clear().type(value, { parseSpecialCharSequences: false });
});

Cypress.Commands.add("fazerLogin", (usuario: string, senha: string) => {
  cy.visit(`/login`);

  const campoUsuario = cy.get("input").eq(0);
  const campoSenha = cy.get("input").eq(1);

  campoUsuario.then((campo) => cy.wrap(campo).type(usuario));
  campoSenha.then((campo) => cy.wrap(campo).type(senha));
  cy.get("button").then((entrar) => cy.wrap(entrar).click());

  cy.url().should("include", "/dashboard");
});

Cypress.Commands.add("fazerLoginComoAdmin", () => {
  const usuario = Cypress.env("USUARIO");
  const senha = Cypress.env("SENHA");

  if (!usuario || !senha) throw new Error("USUARIO e SENHA não definidas no arquivo .env");

  cy.fazerLogin(usuario, senha);
});

Cypress.Commands.add("logout", () => {
  cy.get("header").children().last().find("button").click();
  cy.get("div").contains("Sair").click();

  cy.url().should("equal", `${Cypress.config().baseUrl}/login`);
});

Cypress.Commands.add("irPara", (rota: string) => {
  cy.visit(rota);
});

Cypress.Commands.add("verificarTitulo", (titulo: string) => {
  cy.title().should("contain", titulo);
});

// Declarar funções customizadas no namespace Cypress
// Isso é necessário para que o TypeScript reconheça as funções customizadas
declare namespace Cypress {
  interface Chainable {
    fazerLogin(usuario: string, senha: string): Chainable<void>;
    fazerLoginComoAdmin(): Chainable<void>;
    logout(): Chainable<void>;
    fillInput(element: HTMLElement | Element, value: string): Chainable<void>;
    irPara(rota: string): Chainable<void>;
    verificarTitulo(titulo: string): Chainable<void>;
  }
}

