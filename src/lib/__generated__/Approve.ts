/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: Approve
// ====================================================

export interface Approve_addPullRequestReview_pullRequestReview {
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
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface Approve_addPullRequestReview {
  __typename: "AddPullRequestReviewPayload";
  /**
   * The newly created pull request review.
   */
  pullRequestReview: Approve_addPullRequestReview_pullRequestReview | null;
}

export interface Approve {
  /**
   * Adds a review to a Pull Request.
   */
  addPullRequestReview: Approve_addPullRequestReview | null;
}

export interface ApproveVariables {
  pullRequestId: string;
  commitOID?: any | null;
}
