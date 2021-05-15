/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: InboxSearchResultItem
// ====================================================

export interface InboxSearchResultItem_nodes_App {
  __typename: "App" | "Issue" | "MarketplaceListing" | "Organization" | "Repository" | "User";
}

export interface InboxSearchResultItem_nodes_PullRequest_repository {
  __typename: "Repository";
  /**
   * The repository's name with owner.
   */
  nameWithOwner: string;
}

export interface InboxSearchResultItem_nodes_PullRequest {
  __typename: "PullRequest";
  /**
   * The repository associated with this node.
   */
  repository: InboxSearchResultItem_nodes_PullRequest_repository;
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

export type InboxSearchResultItem_nodes = InboxSearchResultItem_nodes_App | InboxSearchResultItem_nodes_PullRequest;

export interface InboxSearchResultItem_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
}

export interface InboxSearchResultItem {
  __typename: "SearchResultItemConnection";
  /**
   * A list of nodes.
   */
  nodes: (InboxSearchResultItem_nodes | null)[] | null;
  /**
   * The number of issues that matched the search query.
   */
  issueCount: number;
  /**
   * Information to aid in pagination.
   */
  pageInfo: InboxSearchResultItem_pageInfo;
}
