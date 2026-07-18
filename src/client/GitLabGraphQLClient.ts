interface GitLabGraphQLResponse<T> {
	data?: T;
	errors?: GitLabGraphQLError[];
}

interface GitLabGraphQLError {
	message: string;
}

export class GitLabGraphQLClient {
	private readonly baseUrl: string;

	public constructor(
		baseUrl: string,
		private readonly token: string,
	) {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	public async request<T>(
		query: string,
		variables: Record<string, unknown> = {},
	): Promise<T> {
		const response = await fetch(
			`${this.baseUrl}/api/graphql`,
			{
				method: 'POST',
				headers: this.createHeaders(),
				body: JSON.stringify({
					query,
					variables,
				}),
			},
		);

		if (!response.ok) {
			throw await this.createRequestError(response);
		}

		const result =
			await response.json() as GitLabGraphQLResponse<T>;

		this.assertSuccessfulResponse(result);

		return result.data;
	}

	private createHeaders(): Record<string, string> {
		return {
			'PRIVATE-TOKEN': this.token,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		};
	}

	private async createRequestError(
		response: Response,
	): Promise<Error> {
		const responseText = await response.text();

		return new Error(
			`GitLab GraphQL API returned ` +
				`${response.status} ` +
				`${response.statusText}: ` +
				responseText,
		);
	}

	private assertSuccessfulResponse<T>(
		result: GitLabGraphQLResponse<T>,
	): asserts result is GitLabGraphQLResponse<T> & {
		data: T;
	} {
		if (result.errors?.length) {
			const errorMessage = result.errors
				.map(error => error.message)
				.join('; ');

			throw new Error(
				`GitLab GraphQL API returned errors: ` +
					errorMessage,
			);
		}

		if (!result.data) {
			throw new Error(
				'GitLab GraphQL API returned no data',
			);
		}
	}
}