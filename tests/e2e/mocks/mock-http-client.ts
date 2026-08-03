import { HttpClient, HttpOptions, HttpResponse } from '../../../src/domain/interfaces/http';

export interface MockRoute {
	match: (url: string, opts?: HttpOptions) => boolean;
	handler: (url: string, opts?: HttpOptions) => MockResponse;
}

export interface MockResponse {
	status: number;
	statusText: string;
	body: unknown;
}

export function createMockHttpClient(routes: MockRoute[]): HttpClient {
	const calledUrls: Array<{ url: string; options?: HttpOptions }> = [];

	return {
		request: async (url: string, options?: HttpOptions) => {
			calledUrls.push({ url, options });

			const route = routes.find((r) => r.match(url, options));
			if (!route) {
				throw new Error(`No mock for: ${options?.method ?? 'GET'} ${url}`);
			}

			const response = route.handler(url, options);
			return createMockResponse(response);
		},
	};
}

export function createMockResponse(data: MockResponse): HttpResponse {
	return {
		ok: data.status >= 200 && data.status < 300,
		status: data.status,
		statusText: data.statusText,
		text: async () => typeof data.body === 'string' ? data.body : '',
		json: async <T = unknown>() => data.body as T,
	};
}

export function matchUrl(pattern: string): (url: string) => boolean {
	return (url) => url.includes(pattern);
}

export function matchMethod(method: string): (url: string, opts?: HttpOptions) => boolean {
	return (_url, opts) => opts?.method?.toUpperCase() === method.toUpperCase();
}

export function matchAll(
	...predicates: Array<(url: string, opts?: HttpOptions) => boolean>
): (url: string, opts?: HttpOptions) => boolean {
	return (url, opts) => predicates.every((p) => p(url, opts));
}