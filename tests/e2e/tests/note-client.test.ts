import { createMockHttpClient } from '../mocks/mock-http-client';
import { GitLabNoteClient, GitLabNote } from '../../../src/domain/client/GitLabNoteClient';

describe('GitLabNoteClient', () => {
	const mr = {
		id: 100, iid: 42, project_id: 10,
		baseSha: 'abc123', startSha: 'def456', headSha: 'ghi789',
	};

	it('creates a draft note', async () => {
		let capturedUrl = '';
		let capturedBody: FormData | null = null;

		const http = createMockHttpClient([
			{
				match: () => {
					return true;
				},
				handler: (url, opts) => {
					capturedUrl = url;
					capturedBody = (opts as { body?: FormData })?.body ?? null;
					return {
						status: 201,
						statusText: 'Created',
						body: { id: 999, note: 'test comment' },
					};
				},
			},
		]);

		const client = new GitLabNoteClient('https://gitlab.example.com', 'token', http as any);
		const note = await client.createDraftNote(
			mr as any,
			{ path: 'src/app.ts', oldPath: 'src/app.ts', newPath: 'src/app.ts', diff: '', added: false, deleted: false, renamed: false },
			'Fix this bug',
			5,
			6,
		);

		expect(note.id).toBe(999);
		expect(capturedUrl).toContain('/draft_notes');
		expect(capturedBody).not.toBeNull();
		expect(capturedBody!.get('note')).toBe('Fix this bug');
		expect(capturedBody!.get('position[old_line]')).toBe('5');
		expect(capturedBody!.get('position[new_line]')).toBe('6');
	});

	it('submits a draft note', async () => {
		let capturedMethod = '';

		const http = createMockHttpClient([
			{
				match: () => true,
				handler: (url, opts) => {
					capturedMethod = (opts as { method?: string })?.method ?? '';
					return {
						status: 200,
						statusText: 'OK',
						body: { id: 999, note: 'test comment', draft: false },
					};
				},
			},
		]);

		const client = new GitLabNoteClient('https://gitlab.example.com', 'token', http as any);
		const note = await client.submitNote(mr as any, 999);

		expect(note.id).toBe(999);
		expect(capturedMethod).toBe('PATCH');
	});

	it('throws error when creating draft note fails', async () => {
		const http = createMockHttpClient([
			{
				match: () => true,
				handler: () => ({
					status: 403,
					statusText: 'Forbidden',
					body: { message: 'Forbidden' },
				}),
			},
		]);

		const client = new GitLabNoteClient('https://gitlab.example.com', 'token', http as any);
		await expect(
			client.createDraftNote(
				mr as any,
				{ path: 'src/app.ts', oldPath: 'src/app.ts', newPath: 'src/app.ts', diff: '', added: false, deleted: false, renamed: false },
				'comment',
			),
		).rejects.toThrow('403');
	});
});