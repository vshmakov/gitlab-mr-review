import { GitLabNoteClient } from '../../src/domain/client/GitLabNoteClient';

function createMockHttp() {
	return {
		request: jest.fn(),
	};
}

describe('GitLabNoteClient', () => {
	it('createDraftNote builds correct path', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42, baseSha: 'abc', startSha: 'def', headSha: 'ghi' };
		const file = { oldPath: 'src/a.ts', newPath: 'src/a.ts' };

		await client.createDraftNote(mr as any, file as any, 'comment');

		expect(http.request.mock.calls[0][0]).toContain('/api/v4/projects/10/merge_requests/42/draft_notes');
	});

	it('createDraftNote sends form data', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42, baseSha: 'abc', startSha: 'def', headSha: 'ghi' };
		const file = { oldPath: 'src/a.ts', newPath: 'src/a.ts' };

		await client.createDraftNote(mr as any, file as any, 'comment');

		const body = http.request.mock.calls[0][1].body;
		expect(body).toContain('note=comment');
		expect(body).toContain('position%5Bbase_sha%5D=abc');
		expect(body).toContain('position%5Bnew_path%5D=src%2Fa.ts');
	});

	it('createDraftNote includes line numbers when provided', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42, baseSha: 'abc', startSha: 'def', headSha: 'ghi' };
		const file = { oldPath: 'src/a.ts', newPath: 'src/a.ts' };

		await client.createDraftNote(mr as any, file as any, 'comment', 5, 6);

		const body = http.request.mock.calls[0][1].body;
		expect(body).toContain('position%5Bold_line%5D=5');
		expect(body).toContain('position%5Bnew_line%5D=6');
	});

	it('createDraftNote omits line numbers when not provided', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42, baseSha: 'abc', startSha: 'def', headSha: 'ghi' };
		const file = { oldPath: 'src/a.ts', newPath: 'src/a.ts' };

		await client.createDraftNote(mr as any, file as any, 'comment');

		const body = http.request.mock.calls[0][1].body;
		expect(body).not.toContain('old_line');
		expect(body).not.toContain('new_line');
	});

	it('createDraftNote throws on non-ok response', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: false, status: 400, text: () => 'Bad request' });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42, baseSha: 'abc', startSha: 'def', headSha: 'ghi' };
		const file = { oldPath: 'src/a.ts', newPath: 'src/a.ts' };

		await expect(client.createDraftNote(mr as any, file as any, 'comment')).rejects.toThrow('400');
	});

	it('submitNote sends PATCH with draft:false', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42 };

		await client.submitNote(mr as any, 123);

		expect(http.request.mock.calls[0][1].method).toBe('PATCH');
		expect(http.request.mock.calls[0][1].body).toBe('{"draft":false}');
	});

	it('submitNote builds correct path', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42 };

		await client.submitNote(mr as any, 123);

		expect(http.request.mock.calls[0][0]).toContain('/api/v4/projects/10/merge_requests/42/notes/123');
	});

	it('submitNote throws on non-ok response', async () => {
		const http = createMockHttp();
		http.request.mockResolvedValue({ ok: false, status: 404, text: () => 'Not found' });
		const client = new GitLabNoteClient('https://gitlab.com', 'token123', http);
		const mr = { project_id: 10, iid: 42 };

		await expect(client.submitNote(mr as any, 123)).rejects.toThrow('404');
	});
});