import { gql } from "@apollo/client";
import { pullRequestReviewCommentRestLikeFragment, pullRequestReviewFragment, pullRequestReviewThreadFragment } from "./GithubFragments";

export const addCommentMutation = gql`
  ${pullRequestReviewThreadFragment}
  ${pullRequestReviewFragment}
  mutation AddComment($input: AddPullRequestReviewThreadInput!, $submitNow: Boolean!, $submitInput: SubmitPullRequestReviewInput!) {
    addPullRequestReviewThread(input: $input) {
      thread {
        ...PullRequestReviewThreadFragment
      }
    }
    submitPullRequestReview(input: $submitInput) @include(if: $submitNow) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
`;

export const addReplyCommentMutation = gql`
  ${pullRequestReviewCommentRestLikeFragment}
  ${pullRequestReviewFragment}
  mutation AddReplyComment($input: AddPullRequestReviewCommentInput!, $submitNow: Boolean!, $submitInput: SubmitPullRequestReviewInput!) {
    addPullRequestReviewComment(input: $input) {
      comment {
        ...PullRequestReviewCommentRestLikeFragment
      }
    }
    submitPullRequestReview(input: $submitInput) @include(if: $submitNow) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
`;

export const editCommentMutation = gql`
  ${pullRequestReviewCommentRestLikeFragment}
  mutation EditComment($commentId: ID!, $body: String!) {
    updatePullRequestReviewComment(input: {pullRequestReviewCommentId: $commentId, body: $body}) {
      pullRequestReviewComment {
        ...PullRequestReviewCommentRestLikeFragment
      }
    }
  }
`;

export const deleteCommentMutation = gql`
  ${pullRequestReviewFragment}
  mutation DeleteComment($commentId: ID!) {
    deletePullRequestReviewComment(input: {id: $commentId}) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
`;

export const approveMutation = gql`
  ${pullRequestReviewFragment}
  mutation Approve($pullRequestId: ID!, $commitOID: GitObjectID) {
    addPullRequestReview(input: {pullRequestId: $pullRequestId, commitOID: $commitOID, event: APPROVE}) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
`;

export const submitReviewMutation = gql`
  ${pullRequestReviewFragment}
  mutation SubmitReview($input: SubmitPullRequestReviewInput!) {
    submitPullRequestReview(input: $input) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
`;