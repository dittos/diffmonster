import { getUserInfo } from '../GithubAuth';

export default function getInitialState() {
  return {
    currentUser: getUserInfo(),
    status: 'loading',
    pullRequest: null,
    pullRequestIdFromGraphQL: null,
    files: null,
    comments: null,
    isLoadingReviewStates: false,
    reviewStates: null,
    latestReview: null,
    isAddingReview: false,
  };
}
