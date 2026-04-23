import test from 'node:test';
import assert from 'node:assert/strict';
import { WalletController } from '../src/controllers/walletController';

test('getMyWallet returns wallet summary with 200 status', async () => {
  const mockResult = { balance: 1000 };

  const walletService = {
    getWalletSummary: async () => mockResult
  };

  const controller = new WalletController(walletService as never);

  const request = {
    auth: { userId: 'user-1' },
    query: { userId: 'user-1' }
  };

  let statusCode: number | undefined;
  let jsonBody: any;

  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: any) {
      jsonBody = body;
    }
  };

  await controller.getMyWallet(request as never, response as never);

  assert.equal(statusCode, 200);
  assert.deepEqual(jsonBody, mockResult);
});