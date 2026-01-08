import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on: any, config: any) {
      // implementação de eventos do node
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.ts', // Update the path
    supportFile: 'cypress/support/e2e.ts', // Update the path
    fixturesFolder: 'cypress/fixtures', // Update the path
  },
});
