/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AddPullRequestReviewThreadInput, SubmitPullRequestReviewInput, PullRequestReviewCommentState, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: AddComment
// ====================================================

export interface AddComment_addPullRequestReviewThread_thread_resolvedBy {
  __typename: "User";
  /**
   * The HTTP URL for this user
   */
  url: any;
  /**
   * The username used to login.
   */
  login: string;
}

export interface AddComment_addPullRequestReviewThread_thread_comments_nodes_author_Bot {
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

export interface AddComment_addPullRequestReviewThread_thread_comments_nodes_author_User {
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

export type AddComment_addPullRequestReviewThread_thread_comments_nodes_author = AddComment_addPullRequestReviewThread_thread_comments_nodes_author_Bot | AddComment_addPullRequestReviewThread_thread_comments_nodes_author_User;

export interface AddComment_addPullRequestReviewThread_thread_comments_nodes_pullRequestReview {
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

export interface AddComment_addPullRequestReviewThread_thread_comments_nodes {
  __typename: "PullRequestReviewComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: AddComment_addPullRequestReviewThread_thread_comments_nodes_author | null;
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
  pullRequestReview: AddComment_addPullRequestReviewThread_thread_comments_nodes_pullRequestReview | null;
}

export interface AddComment_addPullRequestReviewThread_thread_comments_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating backwards, are there more items?
   */
  hasPreviousPage: boolean;
  /**
   * When paginating backwards, the cursor to continue.
   */
  startCursor: string | null;
}

export interface AddComment_addPullRequestReviewThread_thread_comments {
  __typename: "PullRequestReviewCommentConnection";
  /**
   * A list of nodes.
   */
  nodes: (AddComment_addPullRequestReviewThread_thread_comments_nodes | null)[] | null;
  /**
   * Information to aid in pagination.
   */
  pageInfo: AddComment_addPullRequestReviewThread_thread_comments_pageInfo;
}

export interface AddComment_addPullRequestReviewThread_thread {
  __typename: "PullRequestReviewThread";
  id: string;
  /**
   * Whether this thread has been resolved
   */
  isResolved: boolean;
  /**
   * The user who resolved this thread
   */
  resolvedBy: AddComment_addPullRequestReviewThread_thread_resolvedBy | null;
  /**
   * A list of pull request comments associated with the thread.
   */
  comments: AddComment_addPullRequestReviewThread_thread_comments;
  /**
   * Indicates whether the current viewer can reply to this thread.
   */
  viewerCanReply: boolean;
}

export interface AddComment_addPullRequestReviewThread {
  __typename: "AddPullRequestReviewThreadPayload";
  /**
   * The newly created thread.
   */
  thread: AddComment_addPullRequestReviewThread_thread | null;
}

export interface AddComment_submitPullRequestReview_pullRequestReview {
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

export interface AddComment_submitPullRequestReview {
  __typename: "SubmitPullRequestReviewPayload";
  /**
   * The submitted pull request review.
   */
  pullRequestReview: AddComment_submitPullRequestReview_pullRequestReview | null;
}

export interface AddComment {
  /**
   * Adds a new thread to a pending Pull Request Review.
   */
  addPullRequestReviewThread: AddComment_addPullRequestReviewThread | null;
  /**
   * Submits a pending pull request review.
   */
  submitPullRequestReview: AddComment_submitPullRequestReview | null;
}

export interface AddCommentVariables {
  input: AddPullRequestReviewThreadInput;
  submitNow: boolean;
  submitInput: SubmitPullRequestReviewInput;
}
