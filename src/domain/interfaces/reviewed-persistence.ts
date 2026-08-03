import { ReviewedFilesStore } from '../store/ReviewedFilesStore';

export interface ReviewedPersistence {
    save(store: ReviewedFilesStore): void;
}