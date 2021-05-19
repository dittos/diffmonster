/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: PullRequestQuery
// ====================================================

export interface PullRequestQuery_repository_pullRequest_viewerLatestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
  /**
   * Did the viewer author this comment.
   */
  viewerDidAuthor: boolean;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
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
   * The latest review given from the viewer.
   */
  viewerLatestReview: PullRequestQuery_repository_pullRequest_viewerLatestReview | null;
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
