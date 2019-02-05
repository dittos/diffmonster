import { getUserInfo } from '../lib/GithubAuth';
import { PullRequestCommentDTO, PullRequestReviewDTO, PullRequestDTO } from '../lib/Github';
import { DiffFile } from '../lib/DiffParser';

export type AppStatus = 'loading' | 'notFound' | 'success';

export interface AppState {
  currentUser: any;
  status: AppStatus;
  pullRequest: PullRequestDTO | null;
  pullRequestBodyRendered: string | undefined;
  files: DiffFile[] | null;
  comments: PullRequestCommentDTO[];
  pendingComments: PullRequestCommentDTO[];
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
    comments: [],
    pendingComments: [],
    isLoadingReviewStates: false,
    reviewStates: null,
    latestReview: null,
    isAddingReview: false,
  };
}
