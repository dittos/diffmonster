import { UserDTO } from '../lib/Github';
import { DiffFile } from '../lib/DiffParser';
import { PullRequestQuery_repository_pullRequest } from '../stores/__generated__/PullRequestQuery';
import { PullRequestReviewThreadFragment } from '../stores/__generated__/PullRequestReviewThreadFragment';
import { PullRequestReviewCommentRestLikeFragment } from '../stores/__generated__/PullRequestReviewCommentRestLikeFragment';
import { PullRequestReviewFragment } from '../stores/__generated__/PullRequestReviewFragment';

export type AppStatus = 'loading' | 'notFound' | 'success';

export type PullRequestDTO = PullRequestQuery_repository_pullRequest;

export type PullRequestCommentDTO = PullRequestReviewCommentRestLikeFragment;

export type PullRequestReviewDTO = PullRequestReviewFragment;

export type PullRequestReviewThreadDTO = PullRequestReviewThreadFragment;

export type ReviewOpinion = 'approved' | 'changesRequested' | 'none';

export interface AppState {
  currentUser: UserDTO | undefined;
  status: AppStatus;
  pullRequest: PullRequestDTO | null;
  files: DiffFile[] | null;
  reviewThreads: PullRequestReviewThreadDTO[];
  isLoadingReviewStates: boolean;
  reviewStates: {[fileId: string]: boolean} | null;
  reviewOpinion: ReviewOpinion;
  hasPendingReview: boolean;
  isAddingReview: boolean;
}

export type PullRequestLoadedState = AppState & {
  pullRequest: PullRequestDTO;
};