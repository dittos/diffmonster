import { getUserInfo } from '../lib/GithubAuth';
import { AppState } from './types';

export default function getInitialState(): AppState {
  return {
    currentUser: getUserInfo(),
    status: 'loading',
    pullRequest: null,
    files: null,
    reviewThreads: [],
    isLoadingReviewStates: false,
    reviewStates: null,
    latestReview: null,
    isAddingReview: false,
  };
}
