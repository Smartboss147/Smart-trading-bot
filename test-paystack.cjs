const { Paystack } = require('@paystack/paystack-sdk');
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY || 'sk_test_123');
console.log(Object.keys(paystack));
