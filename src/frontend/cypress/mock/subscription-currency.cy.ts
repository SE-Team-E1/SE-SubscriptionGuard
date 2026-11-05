function field(label: string) {
  return cy.contains('label', new RegExp(`^${label}$`))
    .closest('.v-input')
    .find('input')
}

describe('subscription currency', () => {
  for (const { currency, symbol } of [
    { currency: 'EUR', symbol: '€' },
    { currency: 'USD', symbol: '$' },
    { currency: 'GBP', symbol: '£' },
  ]) {
    it(`shows ${symbol} in the list after creating a ${currency} subscription`, () => {
      const name = `Currency test ${currency}`
      cy.viewport(390, 844)
      cy.visit('/add')
      field('Name').type(name)
      field('Kosten').clear().type('9.99')
      field('Währung').closest('.v-input').click()
      cy.get('[role="option"]').contains(symbol).click()
      field('Tag').type('01')
      field('Monat').type('06')
      field('Jahr').type('2026')
      field('Vertragspartner').type('Subscription 0 GmbH')
      cy.get('[role="option"]').contains('Subscription 0 GmbH').click()
      cy.contains('button', 'Hinzufügen').should('be.enabled').click()

      // A reset form confirms that creation completed before navigating away.
      field('Name').should('have.value', '')
      cy.contains('a', 'Subscriptions').click()
      cy.contains('.v-list-item', name).within(() => {
        cy.get('.v-list-item-subtitle').should('contain.text', `9.99 ${symbol}`)
      })
    })
  }
})
