export interface GitLabUser {
	id: number;
	username: string;
	name: string;
}

export interface GitLabMergeRequest {
	id: number;
	iid: number;
	title: string;
	web_url: string;
	project_id: number;
	updated_at: string;
	draft: boolean;
	work_in_progress: boolean;
	references?: {
		short?: string;
		relative?: string;
		full?: string;
	};
	author?: {
		name: string;
		username: string;
	};
}

interface GitLabGraphQLResponse<T> {
	data?: T;
	errors?: Array<{
		message: string;
	}>;
}

interface GraphQLUser {
	username: string;
}

interface GraphQLReviewer extends GraphQLUser {
	mergeRequestInteraction?: {
		reviewState: string;
	};
}

interface GraphQLApprovalState {
	approvedBy?: {
		nodes: GraphQLUser[];
	};
	reviewers?: {
		nodes: GraphQLReviewer[];
	};
}

type ApprovalStatesQuery = Record<
	string,
	GraphQLApprovalState | null
>;

export class GitLabClient {
	private static readonly GRAPHQL_BATCH_SIZE = 10;

	private readonly baseUrl: string;

	public constructor(
		baseUrl: string,
		private readonly token: string,
	) {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	public async getCurrentUser(): Promise<GitLabUser> {
		return this.restRequest<GitLabUser>('/api/v4/user');
	}

	public async getMergeRequestsForReviewer(
		reviewerId: number,
	): Promise<GitLabMergeRequest[]> {
		const params = new URLSearchParams({
			scope: 'all',
			state: 'opened',
			reviewer_id: reviewerId.toString(),
			order_by: 'updated_at',
			sort: 'desc',
			per_page: '100',
		});

		return this.restRequest<GitLabMergeRequest[]>(
			`/api/v4/merge_requests?${params.toString()}`,
		);
	}

	public async getPendingReviews(
		user: GitLabUser,
	): Promise<GitLabMergeRequest[]> {
		const mergeRequests =
			await this.getMergeRequestsForReviewer(user.id);

		if (mergeRequests.length === 0) {
			return [];
		}

		const pendingMergeRequests: GitLabMergeRequest[] = [];

		for (
			let offset = 0;
			offset < mergeRequests.length;
			offset += GitLabClient.GRAPHQL_BATCH_SIZE
		) {
			const batch = mergeRequests.slice(
				offset,
				offset + GitLabClient.GRAPHQL_BATCH_SIZE,
			);

			const approvalStates =
				await this.getApprovalStates(batch);

			const pendingBatch = batch.filter(
				(_mergeRequest, index) =>
					this.isPendingReview(
						approvalStates[`mr${index}`],
						user.username,
					),
			);

			pendingMergeRequests.push(...pendingBatch);
		}

		return pendingMergeRequests;
	}

	private isPendingReview(
		mergeRequestState: GraphQLApprovalState | null,
		username: string,
	): boolean {
		const approvedBy =
			mergeRequestState?.approvedBy?.nodes ?? [];

		const approvedByCurrentUser =
			approvedBy.some(
				approver =>
					approver.username === username,
			);

		const currentReviewer =
			mergeRequestState
				?.reviewers
				?.nodes
				.find(
					reviewer =>
						reviewer.username === username,
				);

		const reviewState =
			currentReviewer
				?.mergeRequestInteraction
				?.reviewState;

		const requestedChanges =
			reviewState === 'REQUESTED_CHANGES';

		return (
			!approvedByCurrentUser &&
			!requestedChanges
		);
	}

	private async getApprovalStates(
		mergeRequests: GitLabMergeRequest[],
	): Promise<ApprovalStatesQuery> {
		const fields = mergeRequests.map(
			(mergeRequest, index) => {
				const globalId =
					`gid://gitlab/MergeRequest/${mergeRequest.id}`;

				return `
					mr${index}: mergeRequest(
						id: ${JSON.stringify(globalId)}
					) {
						approvedBy {
							nodes {
								username
							}
						}

						reviewers {
							nodes {
								username

								mergeRequestInteraction {
									reviewState
								}
							}
						}
					}
				`;
			},
		);

		const query = `
			query ApprovalStates {
				${fields.join('\n')}
			}
		`;

		return this.graphQLRequest<ApprovalStatesQuery>(
			query,
			{},
		);
	}

	private async graphQLRequest<T>(
		query: string,
		variables: Record<string, unknown>,
	): Promise<T> {
		const response = await fetch(
			`${this.baseUrl}/api/graphql`,
			{
				method: 'POST',
				headers: {
					'PRIVATE-TOKEN': this.token,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					query,
					variables,
				}),
			},
		);

		if (!response.ok) {
			const responseText = await response.text();

			throw new Error(
				`GitLab GraphQL API returned ` +
					`${response.status} ` +
					`${response.statusText}: ` +
					responseText,
			);
		}

		const result =
			await response.json() as GitLabGraphQLResponse<T>;

		if (result.errors?.length) {
			throw new Error(
				`GitLab GraphQL API returned errors: ` +
					result.errors
						.map(error => error.message)
						.join('; '),
			);
		}

		if (!result.data) {
			throw new Error(
				'GitLab GraphQL API returned no data',
			);
		}

		return result.data;
	}

	private async restRequest<T>(
		path: string,
	): Promise<T> {
		const response = await fetch(
			`${this.baseUrl}${path}`,
			{
				headers: {
					'PRIVATE-TOKEN': this.token,
					Accept: 'application/json',
				},
			},
		);

		if (!response.ok) {
			const responseText = await response.text();

			throw new Error(
				`GitLab API returned ${response.status} ` +
					`${response.statusText}: ${responseText}`,
			);
		}

		return response.json() as Promise<T>;
	}
}
