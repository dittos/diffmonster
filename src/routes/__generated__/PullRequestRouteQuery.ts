/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: PullRequestRouteQuery
// ====================================================

export interface PullRequestRouteQuery_repository_pullRequest_baseRepository_owner {
  __typename: "Organization" | "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface PullRequestRouteQuery_repository_pullRequest_baseRepository {
  __typename: "Repository";
  /**
   * The repository's name with owner.
   */
  nameWithOwner: string;
  /**
   * The User owner of the repository.
   */
  owner: PullRequestRouteQuery_repository_pullRequest_baseRepository_owner;
}

export interface PullRequestRouteQuery_repository_pullRequest_author_Bot {
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

export interface PullRequestRouteQuery_repository_pullRequest_author_User {
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

export type PullRequestRouteQuery_repository_pullRequest_author = PullRequestRouteQuery_repository_pullRequest_author_Bot | PullRequestRouteQuery_repository_pullRequest_author_User;

export interface PullRequestRouteQuery_repository_pullRequest_headRepository_owner {
  __typename: "Organization" | "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface PullRequestRouteQuery_repository_pullRequest_headRepository {
  __typename: "Repository";
  /**
   * The HTTP URL for this repository
   */
  url: any;
  /**
   * The User owner of the repository.
   */
  owner: PullRequestRouteQuery_repository_pullRequest_headRepository_owner;
}

export interface PullRequestRouteQuery_repository_pullRequest {
  __typename: "PullRequest";
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * The body rendered to HTML.
   */
  bodyHTML: any;
  /**
   * The repository associated with this pull request's base Ref.
   */
  baseRepository: PullRequestRouteQuery_repository_pullRequest_baseRepository | null;
  id: string;
  /**
   * The HTTP URL for this pull request.
   */
  url: any;
  /**
   * The actor who authored the comment.
   */
  author: PullRequestRouteQuery_repository_pullRequest_author | null;
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
  headRepository: PullRequestRouteQuery_repository_pullRequest_headRepository | null;
}

export interface PullRequestRouteQuery_repository {
  __typename: "Repository";
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: PullRequestRouteQuery_repository_pullRequest | null;
}

export interface PullRequestRouteQuery {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: PullRequestRouteQuery_repository | null;
}

export interface PullRequestRouteQueryVariables {
  owner: string;
  repo: string;
  number: number;
}
