const { generatePaymentLink, verifyPayment } = require('../../src/services/walletService');
const axios = require('axios');

describe('Wallet Service Unit Tests', () => {

    beforeEach(() => {
        spyOn(axios, 'post').and.returnValue(Promise.resolve({
            data: {
                data: { link: 'https://flutterwave.com/pay/mock' }
            }
        }));

        spyOn(axios, 'get').and.returnValue(Promise.resolve({
            data: {
                data: { status: 'successful', amount: 5000, currency: 'NGN' }
            }
        }));
    });

    describe('generatePaymentLink', () => {
        it('should call axios.post with correct payload', async () => {
            const user = { id: 1, email: 'test@example.com', name: 'Test User' };
            const amount = 5000;
            const currency = 'NGN';

            const link = await generatePaymentLink(user, amount, currency, 'http://callback.url');

            expect(link).toBe('https://flutterwave.com/pay/mock');
            expect(axios.post).toHaveBeenCalled();
            // Verify payload arguments
            const args = axios.post.calls.mostRecent().args;
            expect(args[0]).toContain('https://api.flutterwave.com/v3/payments');
            expect(args[1].amount).toBe(5000);
            expect(args[1].currency).toBe('NGN');
            expect(args[1].customer.email).toBe('test@example.com');
        });
    });

    describe('verifyPayment', () => {
        it('should call axios.get and return transaction data', async () => {
            const data = await verifyPayment('12345');

            expect(data.status).toBe('successful');
            expect(axios.get).toHaveBeenCalled();
            const url = axios.get.calls.mostRecent().args[0];
            expect(url).toContain('/transactions/12345/verify');
        });
    });
});
