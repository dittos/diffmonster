import { getUserInfo } from '../lib/GithubAuth';

export default function getInitialState() {
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
