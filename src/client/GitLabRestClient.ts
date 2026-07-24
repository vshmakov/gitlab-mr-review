export class GitLabRestClient {
	private readonly baseUrl: string;

	public constructor(
		baseUrl: string,
		private readonly token: string,
	) {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	public getBaseUrl(): string {
		return this.baseUrl;
	}

	public async get<T>(path: string): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			headers: this.createHeaders(),
		});

		if (!response.ok) {
			throw await this.createRequestError(response);
		}

		return response.json() as Promise<T>;
	}

	public async post<T>(
		path: string,
		body: Record<string, string> = {},
	): Promise<T> {
		const response = await fetch(
			`${this.baseUrl}${path}`,
			{
				method: 'POST',
				headers: this.createHeaders(),
				body: new URLSearchParams(body),
			},
		);

		if (!response.ok) {
			throw await this.createRequestError(response);
		}

		return response.json() as Promise<T>;
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
		response: Response,
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