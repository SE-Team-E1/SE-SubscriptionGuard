const subscription = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  createdAt: '2026-06-01T12:00:00.000Z',
  name: 'Premium Music',
  providerId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  categoriesId: [],
  price: { amount: 9.99, currency: 'EUR' },
  renewal: { amount: 1, unit: 'months' },
  bookingDate: '2026-06-01T12:00:00.000Z',
}

function stubCatalogs() {
  cy.intercept({ method: 'GET', pathname: '/api/providers/' }, {
    body: [{ id: subscription.providerId, name: 'Premium Music Ltd.' }],
  })
  cy.intercept({ method: 'GET', pathname: '/api/categories/' }, { body: [] })
}

describe('subscription list', () => {
  it('shows a loading state while subscriptions are being fetched', () => {
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, {
      delay: 500,
      body: [],
    }).as('getSubscriptions')
    stubCatalogs()

    cy.visit('/list')
    cy.contains('Loading subscriptions…').should('be.visible')
    cy.wait('@getSubscriptions')
    cy.contains('No subscriptions yet').should('be.visible')
  })

  it('shows an empty state and a link to add a subscription', () => {
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, { body: [] })
      .as('getSubscriptions')
    stubCatalogs()

    cy.visit('/list')
    cy.wait('@getSubscriptions')
    cy.contains('No subscriptions yet').should('be.visible')
    cy.contains('Add subscription').should('have.attr', 'href', '/add')
  })

  it('shows an error and retries the request', () => {
    let requestCount = 0
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, (request) => {
      requestCount += 1
      if (requestCount === 1) {
        request.reply({ statusCode: 500, body: { detail: 'Server error' } })
        return
      }
      request.reply({ body: [] })
    }).as('getSubscriptions')
    stubCatalogs()

    cy.visit('/list')
    cy.wait('@getSubscriptions')
    cy.contains('Subscriptions couldn’t be loaded').should('be.visible')
    cy.contains('Try again').click()
    cy.wait('@getSubscriptions')
    cy.contains('No subscriptions yet').should('be.visible')
  })

  it('renders fetched subscriptions', () => {
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, { body: [subscription] })
      .as('getSubscriptions')
    stubCatalogs()

    cy.visit('/list')
    cy.wait('@getSubscriptions')
    cy.contains('Premium Music').should('be.visible')
    cy.contains('9.99 € · 1 months').should('be.visible')
  })
})
