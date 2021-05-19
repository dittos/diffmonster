import { gql } from "@apollo/client";

export const pullRequestReviewFragment = gql`
  fragment PullRequestReviewFragment on PullRequestReview {
    id
    state
    viewerDidAuthor
    createdAt
    databaseId
  }
`;

export const pullRequestReviewCommentRestLikeFragment = gql`
  fragment PullRequestReviewCommentRestLikeFragment on PullRequestReviewComment {
    id: databaseId
    node_id: id
    user: author {
      ... on User {
        id: databaseId
      }
      html_url: url
      login
    }
    body
    path
    position
    state
    pullRequestReview { ...PullRequestReviewFragment }
  }
  ${pullRequestReviewFragment}
`;

export const pullRequestReviewThreadFragment = gql`
  fragment PullRequestReviewThreadFragment on PullRequestReviewThread {
    id
    isResolved
    resolvedBy {
      url
      login
    }
    comments(first: 100) {
      nodes {
        ...PullRequestReviewCommentRestLikeFragment
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
    viewerCanReply
  }
  ${pullRequestReviewCommentRestLikeFragment}
`;

export const addCommentMutation = gql`
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
  ${pullRequestReviewThreadFragment}
  ${pullRequestReviewFragment}
`;

export const addReplyCommentMutation = gql`
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
  ${pullRequestReviewCommentRestLikeFragment}
  ${pullRequestReviewFragment}
`;

export const editCommentMutation = gql`
  mutation EditComment($commentId: ID!, $body: String!) {
    updatePullRequestReviewComment(input: {pullRequestReviewCommentId: $commentId, body: $body}) {
      pullRequestReviewComment {
        ...PullRequestReviewCommentRestLikeFragment
      }
    }
  }
  ${pullRequestReviewCommentRestLikeFragment}
`;

export const deleteCommentMutation = gql`
  mutation DeleteComment($commentId: ID!) {
    deletePullRequestReviewComment(input: {id: $commentId}) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
  ${pullRequestReviewFragment}
`;

export const approveMutation = gql`
  mutation Approve($pullRequestId: ID!, $commitOID: GitObjectID) {
    addPullRequestReview(input: {pullRequestId: $pullRequestId, commitOID: $commitOID, event: APPROVE}) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
  ${pullRequestReviewFragment}
`;

export const submitReviewMutation = gql`
  mutation SubmitReview($input: SubmitPullRequestReviewInput!) {
    submitPullRequestReview(input: $input) {
      pullRequestReview {
        ...PullRequestReviewFragment
      }
    }
  }
  ${pullRequestReviewFragment}
`;