import { gql } from "@apollo/client";

export const pullRequestReviewFragment = gql`
  fragment PullRequestReviewFragment on PullRequestReview {
    id
    state
  }
`;

export const pullRequestReviewCommentRestLikeFragment = gql`
  ${pullRequestReviewFragment}
  fragment PullRequestReviewCommentRestLikeFragment on PullRequestReviewComment {
    id
    author {
      ... on User {
        id: databaseId
      }
      html_url: url
      login
    }
    body
    bodyHTML
    path
    position
    state
    pullRequestReview { ...PullRequestReviewFragment }
  }
`;

export const pullRequestReviewThreadFragment = gql`
  ${pullRequestReviewCommentRestLikeFragment}
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
`;
