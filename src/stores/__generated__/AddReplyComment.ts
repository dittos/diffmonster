/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AddPullRequestReviewCommentInput, SubmitPullRequestReviewInput, PullRequestReviewCommentState, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: AddReplyComment
// ====================================================

export interface AddReplyComment_addPullRequestReviewComment_comment_author_Bot {
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

export interface AddReplyComment_addPullRequestReviewComment_comment_author_User {
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

export type AddReplyComment_addPullRequestReviewComment_comment_author = AddReplyComment_addPullRequestReviewComment_comment_author_Bot | AddReplyComment_addPullRequestReviewComment_comment_author_User;

export interface AddReplyComment_addPullRequestReviewComment_comment_pullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface AddReplyComment_addPullRequestReviewComment_comment {
  __typename: "PullRequestReviewComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: AddReplyComment_addPullRequestReviewComment_comment_author | null;
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
  pullRequestReview: AddReplyComment_addPullRequestReviewComment_comment_pullRequestReview | null;
}

export interface AddReplyComment_addPullRequestReviewComment {
  __typename: "AddPullRequestReviewCommentPayload";
  /**
   * The newly created comment.
   */
  comment: AddReplyComment_addPullRequestReviewComment_comment | null;
}

export interface AddReplyComment_submitPullRequestReview_pullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface AddReplyComment_submitPullRequestReview {
  __typename: "SubmitPullRequestReviewPayload";
  /**
   * The submitted pull request review.
   */
  pullRequestReview: AddReplyComment_submitPullRequestReview_pullRequestReview | null;
}

export interface AddReplyComment {
  /**
   * Adds a comment to a review.
   */
  addPullRequestReviewComment: AddReplyComment_addPullRequestReviewComment | null;
  /**
   * Submits a pending pull request review.
   */
  submitPullRequestReview: AddReplyComment_submitPullRequestReview | null;
}

export interface AddReplyCommentVariables {
  input: AddPullRequestReviewCommentInput;
  submitNow: boolean;
  submitInput: SubmitPullRequestReviewInput;
}
