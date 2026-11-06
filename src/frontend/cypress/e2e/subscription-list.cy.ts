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
    cy.contains('button', 'Try again').click()
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

describe('subscription provider issues', () => {
  const missingProviderId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  const affectedSubscription = {
    ...subscription,
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    name: 'Subscription without provider',
    providerId: missingProviderId,
  }

  it('keeps valid items visible, explains missing items, and recovers on retry', () => {
    cy.viewport(390, 844)
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, {
      body: [subscription, affectedSubscription],
    })
    cy.intercept({ method: 'GET', pathname: '/api/categories/' }, { body: [] })
    let providerRequests = 0
    cy.intercept({ method: 'GET', pathname: '/api/providers/' }, (request) => {
      providerRequests += 1
      const providers = [{ id: subscription.providerId, name: 'Premium Music Ltd.' }]
      if (providerRequests > 1) {
        providers.push({ id: missingProviderId, name: 'Recovered Provider' })
      }
      request.reply({ body: providers })
    })

    cy.visit('/list')
    cy.contains('.v-list-item', subscription.name).should('be.visible')
    cy.get('.list-warning').within(() => {
      cy.contains('This list is incomplete.').should('be.visible')
      cy.contains('Subscription without provider: provider unavailable').should('be.visible')
      cy.screenshot('partial-subscription-list', { capture: 'viewport' })
      cy.contains('button', 'Try again').click()
    })
    cy.contains('.v-list-item', affectedSubscription.name).should('be.visible')
    cy.get('.list-warning').should('not.exist')
  })

  it('shows issues rather than claiming the list is empty when every provider is missing', () => {
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, { body: [affectedSubscription] })
    stubCatalogs()
    cy.visit('/list')
    cy.contains('Some subscriptions couldn’t be loaded').should('be.visible')
    cy.contains('No subscriptions yet').should('not.exist')
    cy.contains('Subscription without provider: provider unavailable').should('be.visible')
  })

  it('explains a provider request failure and recovers on retry', () => {
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, { body: [subscription] })
    cy.intercept({ method: 'GET', pathname: '/api/categories/' }, { body: [] })
    let providerRequests = 0
    cy.intercept({ method: 'GET', pathname: '/api/providers/' }, (request) => {
      providerRequests += 1
      request.reply(providerRequests === 1
        ? { statusCode: 500 }
        : { body: [{ id: subscription.providerId, name: 'Premium Music Ltd.' }] })
    })
    cy.visit('/list')
    cy.contains('Provider details couldn’t be loaded').should('be.visible')
    cy.contains('Your subscriptions couldn’t be displayed because provider details are unavailable.').should('be.visible')
    cy.contains('Premium Music: provider details couldn’t be loaded').should('be.visible')
    cy.get('.list-error').should('not.exist')
    cy.contains('No subscriptions yet').should('not.exist')
    cy.contains('button', 'Try again').click()
    cy.contains('.v-list-item', subscription.name).should('be.visible')
    cy.get('.list-warning').should('not.exist')
  })
})

describe('subscription category issues', () => {
  const category = {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    name: 'Music',
    icon: 'M0 0h24v24H0z',
  }
  const categorizedSubscription = {
    ...subscription,
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    name: 'Categorized subscription',
    categoriesId: [category.id],
  }

  for (const requestFails of [true, false]) {
    it(`keeps uncategorized subscriptions visible when categories ${requestFails ? 'fail to load' : 'are missing'} and recovers on retry`, () => {
      cy.viewport(390, 844)
      cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, {
        body: [subscription, categorizedSubscription],
      })
      cy.intercept({ method: 'GET', pathname: '/api/providers/' }, {
        body: [{ id: subscription.providerId, name: 'Premium Music Ltd.' }],
      })
      let categoryRequests = 0
      cy.intercept({ method: 'GET', pathname: '/api/categories/' }, (request) => {
        categoryRequests += 1
        request.reply(categoryRequests === 1
          ? requestFails ? { statusCode: 500 } : { body: [] }
          : { body: [category] })
      })

      cy.visit('/list')
      cy.contains('.v-list-item', subscription.name).should('be.visible')
      cy.get('.list-error').should('not.exist')
      cy.get('.list-warning').within(() => {
        cy.contains(requestFails ? 'Category details couldn’t be loaded' : 'Some subscriptions couldn’t be loaded').should('be.visible')
        cy.contains(`Categorized subscription: ${requestFails ? 'category details couldn’t be loaded' : 'category unavailable'}`).should('be.visible')
        cy.contains('This list is incomplete.').should('be.visible')
        cy.contains('button', 'Try again').click()
      })
      cy.contains('.v-list-item', categorizedSubscription.name).should('be.visible')
      cy.get('.list-warning').should('not.exist')
    })
  }

  it('shows category issues rather than an empty or fatal state when no subscriptions can be hydrated', () => {
    cy.intercept({ method: 'GET', pathname: '/api/subscriptions/' }, { body: [categorizedSubscription] })
    cy.intercept({ method: 'GET', pathname: '/api/providers/' }, {
      body: [{ id: subscription.providerId, name: 'Premium Music Ltd.' }],
    })
    cy.intercept({ method: 'GET', pathname: '/api/categories/' }, { statusCode: 500 })
    cy.visit('/list')
    cy.contains('Category details couldn’t be loaded').should('be.visible')
    cy.get('.list-error').should('not.exist')
    cy.contains('No subscriptions yet').should('not.exist')
    cy.contains('Categorized subscription: category details couldn’t be loaded').should('be.visible')
  })
})
