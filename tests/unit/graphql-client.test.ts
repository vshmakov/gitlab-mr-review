import { GitLabGraphQLClient } from '../../src/domain/client/GitLabGraphQLClient';

function createMockHttp() {
	return {
		request: jest.fn(),
	};
}

describe('GitLabGraphQLClient', () => {
	it('posts to /api/graphql', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: true,
			json: () => ({ data: { mr: {} } }),
		});
		const client = new GitLabGraphQLClient('https://gitlab.com', 'token123', http);

		await client.request('query { mr { id } }');

		expect(http.request.mock.calls[0][0]).toBe('https://gitlab.com/api/graphql');
	});

	it('sends query and variables in JSON body', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: true,
			json: () => ({ data: { mr: {} } }),
		});
		const client = new GitLabGraphQLClient('https://gitlab.com', 'token123', http);

		await client.request('query { mr }', { id: 1 });

		const body = JSON.parse(http.request.mock.calls[0][1].body);
		expect(body.query).toBe('query { mr }');
		expect(body.variables).toEqual({ id: 1 });
	});

	it('throws on graphql errors', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: true,
			json: () => ({
				errors: [{ message: 'Not found' }],
			}),
		});
		const client = new GitLabGraphQLClient('https://gitlab.com', 'token123', http);

		await expect(client.request('query { mr }')).rejects.toThrow('Not found');
	});

	it('throws when data is missing', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: true,
			json: () => ({}),
		});
		const client = new GitLabGraphQLClient('https://gitlab.com', 'token123', http);

		await expect(client.request('query { mr }')).rejects.toThrow('no data');
	});

	it('throws on non-ok response', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			text: () => 'Server error',
		});
		const client = new GitLabGraphQLClient('https://gitlab.com', 'token123', http);

		await expect(client.request('query { mr }')).rejects.toThrow('500');
	});

	it('joins multiple error messages', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: true,
			json: () => ({
				errors: [{ message: 'Error 1' }, { message: 'Error 2' }],
			}),
		});
		const client = new GitLabGraphQLClient('https://gitlab.com', 'token123', http);

		await expect(client.request('query { mr }')).rejects.toThrow('Error 1; Error 2');
	});

	it('returns data from response', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: true,
			json: () => ({ data: { mr: { id: 1 } } }),
		});
		const client = new GitLabGraphQLClient('https://gitlab.com', 'token123', http);

		const result = await client.request('query { mr { id } }');

		expect(result).toEqual({ mr: { id: 1 } });
	});
});