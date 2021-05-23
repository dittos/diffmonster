/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: PullRequestQuery
// ====================================================

export interface PullRequestQuery_repository_pullRequest_opinionatedReviews_nodes {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface PullRequestQuery_repository_pullRequest_opinionatedReviews {
  __typename: "PullRequestReviewConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_opinionatedReviews_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_pendingReviews_nodes {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface PullRequestQuery_repository_pullRequest_pendingReviews {
  __typename: "PullRequestReviewConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_pendingReviews_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest {
  __typename: "PullRequest";
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  id: string;
  /**
   * The HTTP URL for this pull request.
   */
  url: any;
  /**
   * Identifies the oid of the base ref associated with the pull request, even if the ref has been deleted.
   */
  baseRefOid: any;
  /**
   * Identifies the oid of the head ref associated with the pull request, even if the ref has been deleted.
   */
  headRefOid: any;
  /**
   * A list of reviews associated with the pull request.
   */
  opinionatedReviews: PullRequestQuery_repository_pullRequest_opinionatedReviews | null;
  /**
   * A list of reviews associated with the pull request.
   */
  pendingReviews: PullRequestQuery_repository_pullRequest_pendingReviews | null;
}

export interface PullRequestQuery_repository {
  __typename: "Repository";
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: PullRequestQuery_repository_pullRequest | null;
}

export interface PullRequestQuery {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: PullRequestQuery_repository | null;
}

export interface PullRequestQueryVariables {
  owner: string;
  repo: string;
  number: number;
}
