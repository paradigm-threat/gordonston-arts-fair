import React from 'react';
import ManualTransactionAdmin from '../ManualTransactionAdmin';

describe('<ManualTransactionAdmin />', () => {
    beforeEach(() => {
        // The mount command in cypress/support/component.tsx already handles ThemeRegistry and Router
    });

    it('renders and submits successfully', () => {
        const addManualTransactionStub = cy.stub();
        addManualTransactionStub.resolves({
            status: 'success',
            message: 'Transaction added successfully'
        });
        // Alias the stubless; we'll directly assert on it via cy.then to avoid unsafe chaining

        cy.mount(
            <ManualTransactionAdmin
                userID={123}
                addManualTransaction={addManualTransactionStub}
            />
        );

        cy.contains('Add Manual Transaction').should('be.visible');

        // Fill out the form
        cy.get('input[placeholder="e.g. ch_123... or PayPal ID"]').type('TEST-ID-123');
        cy.get('input[type="number"]').clear();
        cy.get('input[type="number"]').type('99.99');

        // Select provider
        cy.get('div[id*="mui-component-select-provider"]').click();
        cy.get('li').contains('PayPal').click();

        // Select status
        cy.get('div[id*="mui-component-select-newStatus"]').click();
        cy.get('li').contains('Paid').click();

        // Submit
        cy.get('button').contains('Add Transaction').click();

        // Verify stub was called with correct arguments
        cy.then(() => {
            expect(addManualTransactionStub).to.have.been.calledWith(
                123,
                'charge.succeeded',
                99.99,
                'PayPal',
                'TEST-ID-123',
                'paid'
            );
        });

        // Verify success message
        cy.contains('Transaction added successfully').should('be.visible');

        // Verify router refresh was called (from cypress/support/component.tsx mock)
        cy.get('@routerRefresh').should('have.been.called');
    });

    it('handles error during submission', () => {
        const addManualTransactionStub = cy.stub();
        addManualTransactionStub.resolves({
            status: 'error',
            message: 'Failed to add transaction'
        });

        cy.mount(
            <ManualTransactionAdmin
                userID={123}
                addManualTransaction={addManualTransactionStub}
            />
        );

        cy.get('input[placeholder="e.g. ch_123... or PayPal ID"]').type('TEST-ID-ERROR');
        cy.get('button').contains('Add Transaction').click();

        cy.contains('Failed to add transaction').should('be.visible');
    });

    it('validates required fields', () => {
        cy.mount(
            <ManualTransactionAdmin
                userID={123}
                addManualTransaction={cy.stub()}
            />
        );

        // Try to submit without Transaction ID
        cy.get('button').contains('Add Transaction').click();

        // Check if the input is invalid (HTML5 validation)
        cy.get('input[placeholder="e.g. ch_123... or PayPal ID"]').then(($el) => {
            expect(($el[0] as HTMLInputElement).checkValidity()).to.equal(false);
        });
    });
});
