import { initApp, routes } from '../setup';
import { createMr } from '../fixtures';

describe('Approve Merge Request', () => {
	const mr = createMr();

	it('approves a merge request', async () => {
		let approveCalled = false;

		const { factory } = initApp([
			routes.user(),
			{
				match: (url, opts) => {
					const method = (opts as { method?: string })?.method;
					if (method === 'POST' && url.includes('/approve')) {
						approveCalled = true;
						return true;
					}
					return false;
				},
				handler: () => ({ status: 201, statusText: 'Created', body: {} }),
			},
		]);

		await factory.setCredentials('https://gitlab.example.com', 'test-token');
		const client = await factory.create();
		await client!.approveMergeRequest(mr);

		expect(approveCalled).toBe(true);
	});
});