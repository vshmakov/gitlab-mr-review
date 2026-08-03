import { HttpClient, HttpOptions, HttpResponse } from '../../src/domain/interfaces/http';

export const GITLAB_URL = process.env.GITLAB_URL ?? 'https://gitlab.com';
export const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

export function shouldSkip(): boolean {
	return !GITLAB_TOKEN;
}

export function createRealHttpClient(): HttpClient {
	return {
		request: async (url: string, options?: HttpOptions): Promise<HttpResponse> => {
			const fetchInit: RequestInit = {};
			if (options?.method) fetchInit.method = options.method;
			if (options?.headers) fetchInit.headers = options.headers as Record<string, string>;
			if (options?.body) fetchInit.body = options.body as string;

			const response = await fetch(url, fetchInit);
			return {
				ok: response.ok,
				status: response.status,
				statusText: response.statusText,
				text: () => response.text(),
				json: <T = unknown>() => response.json() as Promise<T>,
			};
		},
	};
}