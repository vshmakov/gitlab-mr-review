import { initApp } from '../setup';

describe('Authentication', () => {
	it('sets credentials and creates client', async () => {
		const { factory } = initApp([
			{
				match: (url) => url.includes('/api/v4/user'),
				handler: () => ({ status: 200, statusText: 'OK', body: { id: 1, username: 'testuser', name: 'Test User' } }),
			},
		]);

		const ok = await factory.setCredentials('https://gitlab.example.com', 'test-token');
		expect(ok).toBe(true);

		const client = await factory.create();
		expect(client).toBeDefined();

		const user = await client!.getCurrentUser();
		expect(user.username).toBe('testuser');
	});

	it('rejects invalid credentials', async () => {
		const { factory, notifier } = initApp([
			{
				match: () => true,
				handler: () => ({ status: 401, statusText: 'Unauthorized', body: { message: '401 Unauthorized' } }),
			},
		]);

		const ok = await factory.setCredentials('https://gitlab.example.com', 'bad-token');
		expect(ok).toBe(false);
		expect(notifier.shown.some((s) => s.type === 'error')).toBe(true);
	});
});