/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: DeleteComment
// ====================================================

export interface DeleteComment_deletePullRequestReviewComment_pullRequestReview {
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

export interface DeleteComment_deletePullRequestReviewComment {
  __typename: "DeletePullRequestReviewCommentPayload";
  /**
   * The pull request review the deleted comment belonged to.
   */
  pullRequestReview: DeleteComment_deletePullRequestReviewComment_pullRequestReview | null;
}

export interface DeleteComment {
  /**
   * Deletes a pull request review comment.
   */
  deletePullRequestReviewComment: DeleteComment_deletePullRequestReviewComment | null;
}

export interface DeleteCommentVariables {
  commentId: string;
}
