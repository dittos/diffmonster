import { getUserInfo } from '../lib/GithubAuth';
import { PullRequestReviewDTO, PullRequestDTO, UserDTO, PullRequestReviewThreadDTO } from '../lib/Github';
import { DiffFile } from '../lib/DiffParser';

export type AppStatus = 'loading' | 'notFound' | 'success';

export interface AppState {
  currentUser: UserDTO | undefined;
  status: AppStatus;
  pullRequest: PullRequestDTO | null;
  pullRequestBodyRendered: string | undefined;
  files: DiffFile[] | null;
  reviewThreads: PullRequestReviewThreadDTO[];
  isLoadingReviewStates: boolean;
  reviewStates: {[fileId: string]: boolean} | null;
  latestReview: PullRequestReviewDTO | null;
  isAddingReview: boolean;
}

export type PullRequestLoadedState = AppState & {
  pullRequest: PullRequestDTO;
};

export default function getInitialState(): AppState {
  return {
    currentUser: getUserInfo(),
    status: 'loading',
    pullRequest: null,
    pullRequestBodyRendered: undefined,
    files: null,
    reviewThreads: [],
    isLoadingReviewStates: false,
    reviewStates: null,
    latestReview: null,
    isAddingReview: false,
  };
}

let _nextClientId = 1;

export function generateClientId(): string {
  return `client:${_nextClientId++}`;
}
