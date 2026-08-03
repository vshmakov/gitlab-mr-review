import { normalizeBaseUrl } from './url-utils';
import { HttpClient, HttpResponse } from '../interfaces/http';

export class GitLabRestClient {
	private readonly baseUrl: string;

	public constructor(
		baseUrl: string,
		private readonly token: string,
		private readonly http: HttpClient,
	) {
		this.baseUrl = normalizeBaseUrl(baseUrl);
	}

	public getBaseUrl(): string {
		return this.baseUrl;
	}

	public async get<T>(path: string): Promise<T> {
		const response = await this.http.request(`${this.baseUrl}${path}`, {
			headers: this.createHeaders(),
		});

		if (!response.ok) {
			throw await this.createRequestError(response);
		}

		return response.json<T>();
	}

	public async post<T>(
		path: string,
		body: Record<string, string> = {},
	): Promise<T> {
		const response = await this.http.request(
			`${this.baseUrl}${path}`,
			{
				method: 'POST',
				headers: this.createHeaders(),
				body: new URLSearchParams(body).toString(),
			},
		);

		if (!response.ok) {
			throw await this.createRequestError(response);
		}

		return response.json<T>();
	}

	private createHeaders(): Record<string, string> {
		return {
			'PRIVATE-TOKEN': this.token,
			Accept: 'application/json',
			'Content-Type':
				'application/x-www-form-urlencoded',
		};
	}

	private async createRequestError(
		response: HttpResponse,
	): Promise<Error> {
		const responseText =
			await response.text();

		return new Error(
			`GitLab REST API returned ` +
				`${response.status} ` +
				`${response.statusText}: ` +
				responseText,
		);
	}
}