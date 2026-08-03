export interface HttpOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: unknown;
}

export interface HttpResponse {
	ok: boolean;
	status: number;
	statusText: string;
	text(): Promise<string>;
	json<T>(): Promise<T>;
}

export interface HttpClient {
	request(url: string, options?: HttpOptions): Promise<HttpResponse>;
}