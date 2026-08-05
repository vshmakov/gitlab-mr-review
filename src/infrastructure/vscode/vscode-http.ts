import { HttpClient, HttpOptions, HttpResponse } from '../../domain/interfaces/http';

export class VsCodeHttpClient implements HttpClient {
	public async request(
		url: string,
		options?: HttpOptions,
	): Promise<HttpResponse> {
		const fetchInit: RequestInit = {};

		if (options?.method) {
			fetchInit.method = options.method;
		}
		if (options?.headers) {
			fetchInit.headers = options.headers;
		}
		if (options?.body !== undefined) {
			fetchInit.body = options.body as any;
		}

		const response = await fetch(url, fetchInit);

		return {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			text: () => response.text(),
			json: <T>() => response.json() as Promise<T>,
		};
	}
}