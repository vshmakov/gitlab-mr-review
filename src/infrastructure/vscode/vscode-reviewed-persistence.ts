import { ReviewedFilesStore } from '../../domain/store/ReviewedFilesStore';
import { GlobalState } from '../../domain/interfaces/global-state';
import { ReviewedPersistence } from '../../domain/interfaces/reviewed-persistence';

const REVIEWED_FILES_KEY = 'gitlabMrReview.reviewedFiles';

export class VsCodeReviewedPersistence implements ReviewedPersistence {
    private readonly state: GlobalState;

    public constructor(state: GlobalState) {
        this.state = state;
    }

    public restore(store: ReviewedFilesStore): void {
        const snapshot = this.state.get<Record<string, Record<string, string>>>(
            REVIEWED_FILES_KEY,
            {},
        );
        store.restoreSnapshot(snapshot);
    }

    public save(store: ReviewedFilesStore): void {
        const snapshot = store.getSnapshot();
        this.state.update(REVIEWED_FILES_KEY, snapshot);
    }
}