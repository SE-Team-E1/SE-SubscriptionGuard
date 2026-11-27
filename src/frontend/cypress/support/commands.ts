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

declare global {
  // Cypress extends its types through this namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in through the login page. Tokens only live in memory, so every cy.visit logs
       * the user out again: call this instead of visiting a guarded route, and reach other
       * pages through the navigation. A successful login lands on /list.
       */
      loginViaUi(login: string, password: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('loginViaUi', (login: string, password: string) => {
  const field = (label: string) =>
    cy.contains('label', new RegExp(`^${label}$`)).closest('.v-input').find('input')

  cy.visit('/login')
  field('E-Mail oder Benutzername').type(login)
  field('Passwort').type(password)
  cy.contains('button', 'Anmelden').click()
  cy.location('pathname').should('eq', '/list')
})

export {}
