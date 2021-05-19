/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewCommentState, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: EditComment
// ====================================================

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment_user_Bot {
  __typename: "Bot" | "EnterpriseUserAccount" | "Mannequin" | "Organization";
  /**
   * The HTTP URL for this actor.
   */
  html_url: any;
  /**
   * The username of the actor.
   */
  login: string;
}

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment_user_User {
  __typename: "User";
  /**
   * Identifies the primary key from the database.
   */
  id: number | null;
  /**
   * The HTTP URL for this user
   */
  html_url: any;
  /**
   * The username used to login.
   */
  login: string;
}

export type EditComment_updatePullRequestReviewComment_pullRequestReviewComment_user = EditComment_updatePullRequestReviewComment_pullRequestReviewComment_user_Bot | EditComment_updatePullRequestReviewComment_pullRequestReviewComment_user_User;

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment_pullRequestReview {
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

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment {
  __typename: "PullRequestReviewComment";
  /**
   * Identifies the primary key from the database.
   */
  id: number | null;
  node_id: string;
  /**
   * The actor who authored the comment.
   */
  user: EditComment_updatePullRequestReviewComment_pullRequestReviewComment_user | null;
  /**
   * The comment body of this review comment.
   */
  body: string;
  /**
   * The path to which the comment applies.
   */
  path: string;
  /**
   * The line index in the diff to which the comment applies.
   */
  position: number | null;
  /**
   * Identifies the state of the comment.
   */
  state: PullRequestReviewCommentState;
  /**
   * The pull request review associated with this review comment.
   */
  pullRequestReview: EditComment_updatePullRequestReviewComment_pullRequestReviewComment_pullRequestReview | null;
}

export interface EditComment_updatePullRequestReviewComment {
  __typename: "UpdatePullRequestReviewCommentPayload";
  /**
   * The updated comment.
   */
  pullRequestReviewComment: EditComment_updatePullRequestReviewComment_pullRequestReviewComment | null;
}

export interface EditComment {
  /**
   * Updates a pull request review comment.
   */
  updatePullRequestReviewComment: EditComment_updatePullRequestReviewComment | null;
}

export interface EditCommentVariables {
  commentId: string;
  body: string;
}
