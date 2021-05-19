/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewCommentState, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: PullRequestReviewThreadFragment
// ====================================================

export interface PullRequestReviewThreadFragment_resolvedBy {
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

export interface PullRequestReviewThreadFragment_comments_nodes_user_Bot {
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

export interface PullRequestReviewThreadFragment_comments_nodes_user_User {
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

export type PullRequestReviewThreadFragment_comments_nodes_user = PullRequestReviewThreadFragment_comments_nodes_user_Bot | PullRequestReviewThreadFragment_comments_nodes_user_User;

export interface PullRequestReviewThreadFragment_comments_nodes_pullRequestReview {
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

export interface PullRequestReviewThreadFragment_comments_nodes {
  __typename: "PullRequestReviewComment";
  /**
   * Identifies the primary key from the database.
   */
  id: number | null;
  node_id: string;
  /**
   * The actor who authored the comment.
   */
  user: PullRequestReviewThreadFragment_comments_nodes_user | null;
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
  pullRequestReview: PullRequestReviewThreadFragment_comments_nodes_pullRequestReview | null;
}

export interface PullRequestReviewThreadFragment_comments_pageInfo {
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

export interface PullRequestReviewThreadFragment_comments {
  __typename: "PullRequestReviewCommentConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestReviewThreadFragment_comments_nodes | null)[] | null;
  /**
   * Information to aid in pagination.
   */
  pageInfo: PullRequestReviewThreadFragment_comments_pageInfo;
}

export interface PullRequestReviewThreadFragment {
  __typename: "PullRequestReviewThread";
  id: string;
  /**
   * Whether this thread has been resolved
   */
  isResolved: boolean;
  /**
   * The user who resolved this thread
   */
  resolvedBy: PullRequestReviewThreadFragment_resolvedBy | null;
  /**
   * A list of pull request comments associated with the thread.
   */
  comments: PullRequestReviewThreadFragment_comments;
  /**
   * Indicates whether the current viewer can reply to this thread.
   */
  viewerCanReply: boolean;
}
