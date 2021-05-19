/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestState, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: PullRequestQuery
// ====================================================

export interface PullRequestQuery_repository_pullRequest_baseRepository_owner {
  __typename: "Organization" | "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface PullRequestQuery_repository_pullRequest_baseRepository {
  __typename: "Repository";
  /**
   * The repository's name with owner.
   */
  nameWithOwner: string;
  /**
   * The User owner of the repository.
   */
  owner: PullRequestQuery_repository_pullRequest_baseRepository_owner;
}

export interface PullRequestQuery_repository_pullRequest_headRepository_owner {
  __typename: "Organization" | "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface PullRequestQuery_repository_pullRequest_headRepository {
  __typename: "Repository";
  /**
   * The HTTP URL for this repository
   */
  url: any;
  /**
   * The User owner of the repository.
   */
  owner: PullRequestQuery_repository_pullRequest_headRepository_owner;
}

export interface PullRequestQuery_repository_pullRequest_author_Bot {
  __typename: "Bot" | "EnterpriseUserAccount" | "Mannequin" | "Organization";
  /**
   * The HTTP URL for this actor.
   */
  url: any;
  /**
   * The username of the actor.
   */
  login: string;
}

export interface PullRequestQuery_repository_pullRequest_author_User {
  __typename: "User";
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * The HTTP URL for this user
   */
  url: any;
  /**
   * The username used to login.
   */
  login: string;
}

export type PullRequestQuery_repository_pullRequest_author = PullRequestQuery_repository_pullRequest_author_Bot | PullRequestQuery_repository_pullRequest_author_User;

export interface PullRequestQuery_repository_pullRequest_reviews_nodes {
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

export interface PullRequestQuery_repository_pullRequest_reviews {
  __typename: "PullRequestReviewConnection";
  /**
   * A list of nodes.
   */
  nodes: (PullRequestQuery_repository_pullRequest_reviews_nodes | null)[] | null;
}

export interface PullRequestQuery_repository_pullRequest_pendingReviews_nodes {
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
   * Identifies the pull request number.
   */
  number: number;
  /**
   * The HTTP URL for this pull request.
   */
  url: any;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * The body rendered to HTML.
   */
  bodyHTML: any;
  /**
   * Identifies the state of the pull request.
   */
  state: PullRequestState;
  /**
   * Whether or not the pull request was merged.
   */
  merged: boolean;
  /**
   * Identifies the name of the base Ref associated with the pull request, even if the ref has been deleted.
   */
  baseRefName: string;
  /**
   * Identifies the oid of the base ref associated with the pull request, even if the ref has been deleted.
   */
  baseRefOid: any;
  /**
   * The repository associated with this pull request's base Ref.
   */
  baseRepository: PullRequestQuery_repository_pullRequest_baseRepository | null;
  /**
   * Identifies the name of the head Ref associated with the pull request, even if the ref has been deleted.
   */
  headRefName: string;
  /**
   * Identifies the oid of the head ref associated with the pull request, even if the ref has been deleted.
   */
  headRefOid: any;
  /**
   * The repository associated with this pull request's head Ref.
   */
  headRepository: PullRequestQuery_repository_pullRequest_headRepository | null;
  /**
   * The actor who authored the comment.
   */
  author: PullRequestQuery_repository_pullRequest_author | null;
  /**
   * A list of reviews associated with the pull request.
   */
  reviews: PullRequestQuery_repository_pullRequest_reviews | null;
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
  author: string;
}
