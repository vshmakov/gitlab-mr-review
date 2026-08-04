import { GitLabRestClient } from '../../src/domain/client/GitLabRestClient';

function createMockHttp() {
	return {
		request: jest.fn(),
	};
}

describe('GitLabRestClient', () => {
	it('sends correct headers', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({}) });
		const client = new GitLabRestClient('https://gitlab.com', 'token123', http);

		await client.get('/api/v4/user');

		const headers = http.request.mock.calls[0][1].headers;
		expect(headers['PRIVATE-TOKEN']).toBe('token123');
		expect(headers['Accept']).toBe('application/json');
	});

	it('prepends baseUrl to path', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({}) });
		const client = new GitLabRestClient('https://gitlab.com', 'token123', http);

		await client.get('/api/v4/user');

		expect(http.request.mock.calls[0][0]).toBe('https://gitlab.com/api/v4/user');
	});

	it('throws on non-ok response', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: false,
			status: 401,
			statusText: 'Unauthorized',
			text: () => 'Access denied',
		});
		const client = new GitLabRestClient('https://gitlab.com', 'token123', http);

		await expect(client.get('/api/v4/user')).rejects.toThrow('401');
	});

	it('post sends form-urlencoded body', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({}) });
		const client = new GitLabRestClient('https://gitlab.com', 'token123', http);

		await client.post('/api/v4/approve', { key: 'value' });

		expect(http.request.mock.calls[0][1].body).toBe('key=value');
	});

	it('post uses POST method', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({}) });
		const client = new GitLabRestClient('https://gitlab.com', 'token123', http);

		await client.post('/api/v4/approve');

		expect(http.request.mock.calls[0][1].method).toBe('POST');
	});

	it('normalizes baseUrl', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({}) });
		const client = new GitLabRestClient('https://gitlab.com/', 'token123', http);

		await client.get('/api/v4/user');

		expect(http.request.mock.calls[0][0]).toBe('https://gitlab.com/api/v4/user');
	});

	it('post throws on non-ok response', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({
			ok: false,
			status: 403,
			statusText: 'Forbidden',
			text: () => 'Access denied',
		});
		const client = new GitLabRestClient('https://gitlab.com', 'token123', http);

		await expect(client.post('/api/v4/approve')).rejects.toThrow('403');
	});
});