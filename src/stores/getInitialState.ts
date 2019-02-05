import { getUserInfo } from '../lib/GithubAuth';
import { PullRequestCommentDTO, PullRequestReviewDTO, PullRequestDTO } from '../lib/Github';

export interface State {
  currentUser: any;
  status: 'loading' | 'notFound' | 'success';
  pullRequest: PullRequestDTO | null;
  files: any[] | null;
  comments: PullRequestCommentDTO[];
  pendingComments: PullRequestCommentDTO[];
  isLoadingReviewStates: boolean;
  reviewStates: {[fileId: string]: boolean} | null;
  latestReview: PullRequestReviewDTO | null;
  isAddingReview: boolean;
}

export type PullRequestLoadedState = State & {
  pullRequest: PullRequestDTO;
};

export default function getInitialState(): State {
  return {
    currentUser: getUserInfo(),
    status: 'loading',
    pullRequest: null,
    files: null,
    comments: [],
    pendingComments: [],
    isLoadingReviewStates: false,
    reviewStates: null,
    latestReview: null,
    isAddingReview: false,
  };
}
