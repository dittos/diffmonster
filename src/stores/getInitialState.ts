import { getUserInfo } from '../lib/GithubAuth';
import { AppState } from './types';

export default function getInitialState(): AppState {
  return {
    currentUser: getUserInfo(),
    status: 'loading',
    pullRequest: null,
    files: null,
    reviewThreads: [],
    pendingCommentCount: 0,
    isLoadingReviewStates: false,
    reviewStates: null,
    reviewOpinion: 'none',
    hasPendingReview: false,
    isAddingReview: false,
  };
}
