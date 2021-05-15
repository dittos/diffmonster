/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: InboxSearch
// ====================================================

export interface InboxSearch_reviewed_nodes_App {
  __typename: "App" | "Issue" | "MarketplaceListing" | "Organization" | "Repository" | "User";
}

export interface InboxSearch_reviewed_nodes_PullRequest_repository {
  __typename: "Repository";
  /**
   * The repository's name with owner.
   */
  nameWithOwner: string;
}

export interface InboxSearch_reviewed_nodes_PullRequest {
  __typename: "PullRequest";
  /**
   * The repository associated with this node.
   */
  repository: InboxSearch_reviewed_nodes_PullRequest_repository;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * The HTTP path for this pull request.
   */
  resourcePath: any;
}

export type InboxSearch_reviewed_nodes = InboxSearch_reviewed_nodes_App | InboxSearch_reviewed_nodes_PullRequest;

export interface InboxSearch_reviewed_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
}

export interface InboxSearch_reviewed {
  __typename: "SearchResultItemConnection";
  /**
   * A list of nodes.
   */
  nodes: (InboxSearch_reviewed_nodes | null)[] | null;
  /**
   * The number of issues that matched the search query.
   */
  issueCount: number;
  /**
   * Information to aid in pagination.
   */
  pageInfo: InboxSearch_reviewed_pageInfo;
}

export interface InboxSearch_reviewRequested_nodes_App {
  __typename: "App" | "Issue" | "MarketplaceListing" | "Organization" | "Repository" | "User";
}

export interface InboxSearch_reviewRequested_nodes_PullRequest_repository {
  __typename: "Repository";
  /**
   * The repository's name with owner.
   */
  nameWithOwner: string;
}

export interface InboxSearch_reviewRequested_nodes_PullRequest {
  __typename: "PullRequest";
  /**
   * The repository associated with this node.
   */
  repository: InboxSearch_reviewRequested_nodes_PullRequest_repository;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * The HTTP path for this pull request.
   */
  resourcePath: any;
}

export type InboxSearch_reviewRequested_nodes = InboxSearch_reviewRequested_nodes_App | InboxSearch_reviewRequested_nodes_PullRequest;

export interface InboxSearch_reviewRequested_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
}

export interface InboxSearch_reviewRequested {
  __typename: "SearchResultItemConnection";
  /**
   * A list of nodes.
   */
  nodes: (InboxSearch_reviewRequested_nodes | null)[] | null;
  /**
   * The number of issues that matched the search query.
   */
  issueCount: number;
  /**
   * Information to aid in pagination.
   */
  pageInfo: InboxSearch_reviewRequested_pageInfo;
}

export interface InboxSearch_created_nodes_App {
  __typename: "App" | "Issue" | "MarketplaceListing" | "Organization" | "Repository" | "User";
}

export interface InboxSearch_created_nodes_PullRequest_repository {
  __typename: "Repository";
  /**
   * The repository's name with owner.
   */
  nameWithOwner: string;
}

export interface InboxSearch_created_nodes_PullRequest {
  __typename: "PullRequest";
  /**
   * The repository associated with this node.
   */
  repository: InboxSearch_created_nodes_PullRequest_repository;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * The HTTP path for this pull request.
   */
  resourcePath: any;
}

export type InboxSearch_created_nodes = InboxSearch_created_nodes_App | InboxSearch_created_nodes_PullRequest;

export interface InboxSearch_created_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
}

export interface InboxSearch_created {
  __typename: "SearchResultItemConnection";
  /**
   * A list of nodes.
   */
  nodes: (InboxSearch_created_nodes | null)[] | null;
  /**
   * The number of issues that matched the search query.
   */
  issueCount: number;
  /**
   * Information to aid in pagination.
   */
  pageInfo: InboxSearch_created_pageInfo;
}

export interface InboxSearch {
  /**
   * Perform a search across resources.
   */
  reviewed: InboxSearch_reviewed;
  /**
   * Perform a search across resources.
   */
  reviewRequested: InboxSearch_reviewRequested;
  /**
   * Perform a search across resources.
   */
  created: InboxSearch_created;
}

export interface InboxSearchVariables {
  q1: string;
  q2: string;
  q3: string;
}
