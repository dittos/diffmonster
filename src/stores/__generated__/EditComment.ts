/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewCommentState, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: EditComment
// ====================================================

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment_author_Bot {
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

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment_author_User {
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

export type EditComment_updatePullRequestReviewComment_pullRequestReviewComment_author = EditComment_updatePullRequestReviewComment_pullRequestReviewComment_author_Bot | EditComment_updatePullRequestReviewComment_pullRequestReviewComment_author_User;

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment_pullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface EditComment_updatePullRequestReviewComment_pullRequestReviewComment {
  __typename: "PullRequestReviewComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: EditComment_updatePullRequestReviewComment_pullRequestReviewComment_author | null;
  /**
   * The comment body of this review comment.
   */
  body: string;
  /**
   * The body rendered to HTML.
   */
  bodyHTML: any;
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
