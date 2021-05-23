/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PullRequestReviewCommentState, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ReviewThreadQuery
// ====================================================

export interface ReviewThreadQuery_node_AddedToProjectEvent {
  __typename: "AddedToProjectEvent" | "App" | "AssignedEvent" | "AutoMergeDisabledEvent" | "AutoMergeEnabledEvent" | "AutoRebaseEnabledEvent" | "AutoSquashEnabledEvent" | "AutomaticBaseChangeFailedEvent" | "AutomaticBaseChangeSucceededEvent" | "BaseRefChangedEvent" | "BaseRefDeletedEvent" | "BaseRefForcePushedEvent" | "Blob" | "Bot" | "BranchProtectionRule" | "CWE" | "CheckRun" | "CheckSuite" | "ClosedEvent" | "CodeOfConduct" | "CommentDeletedEvent" | "Commit" | "CommitComment" | "CommitCommentThread" | "ConnectedEvent" | "ConvertToDraftEvent" | "ConvertedNoteToIssueEvent" | "CrossReferencedEvent" | "DemilestonedEvent" | "DependencyGraphManifest" | "DeployKey" | "DeployedEvent" | "Deployment" | "DeploymentEnvironmentChangedEvent" | "DeploymentStatus" | "DisconnectedEvent" | "Enterprise" | "EnterpriseAdministratorInvitation" | "EnterpriseIdentityProvider" | "EnterpriseRepositoryInfo" | "EnterpriseServerInstallation" | "EnterpriseServerUserAccount" | "EnterpriseServerUserAccountEmail" | "EnterpriseServerUserAccountsUpload" | "EnterpriseUserAccount" | "ExternalIdentity" | "Gist" | "GistComment" | "HeadRefDeletedEvent" | "HeadRefForcePushedEvent" | "HeadRefRestoredEvent" | "IpAllowListEntry" | "Issue" | "IssueComment" | "Label" | "LabeledEvent" | "Language" | "License" | "LockedEvent" | "Mannequin" | "MarkedAsDuplicateEvent" | "MarketplaceCategory" | "MarketplaceListing" | "MembersCanDeleteReposClearAuditEntry" | "MembersCanDeleteReposDisableAuditEntry" | "MembersCanDeleteReposEnableAuditEntry" | "MentionedEvent" | "MergedEvent" | "Milestone" | "MilestonedEvent" | "MovedColumnsInProjectEvent" | "OauthApplicationCreateAuditEntry" | "OrgAddBillingManagerAuditEntry" | "OrgAddMemberAuditEntry" | "OrgBlockUserAuditEntry" | "OrgConfigDisableCollaboratorsOnlyAuditEntry" | "OrgConfigEnableCollaboratorsOnlyAuditEntry" | "OrgCreateAuditEntry" | "OrgDisableOauthAppRestrictionsAuditEntry" | "OrgDisableSamlAuditEntry" | "OrgDisableTwoFactorRequirementAuditEntry" | "OrgEnableOauthAppRestrictionsAuditEntry" | "OrgEnableSamlAuditEntry" | "OrgEnableTwoFactorRequirementAuditEntry" | "OrgInviteMemberAuditEntry" | "OrgInviteToBusinessAuditEntry" | "OrgOauthAppAccessApprovedAuditEntry" | "OrgOauthAppAccessDeniedAuditEntry" | "OrgOauthAppAccessRequestedAuditEntry" | "OrgRemoveBillingManagerAuditEntry" | "OrgRemoveMemberAuditEntry" | "OrgRemoveOutsideCollaboratorAuditEntry" | "OrgRestoreMemberAuditEntry" | "OrgUnblockUserAuditEntry" | "OrgUpdateDefaultRepositoryPermissionAuditEntry" | "OrgUpdateMemberAuditEntry" | "OrgUpdateMemberRepositoryCreationPermissionAuditEntry" | "OrgUpdateMemberRepositoryInvitationPermissionAuditEntry" | "Organization" | "OrganizationIdentityProvider" | "OrganizationInvitation" | "Package" | "PackageFile" | "PackageTag" | "PackageVersion" | "PinnedEvent" | "PinnedIssue" | "PrivateRepositoryForkingDisableAuditEntry" | "PrivateRepositoryForkingEnableAuditEntry" | "Project" | "ProjectCard" | "ProjectColumn" | "PublicKey" | "PullRequestCommit" | "PullRequestCommitCommentThread" | "PullRequestReview" | "PullRequestReviewComment" | "PullRequestReviewThread" | "Push" | "PushAllowance" | "Reaction" | "ReadyForReviewEvent" | "Ref" | "ReferencedEvent" | "Release" | "ReleaseAsset" | "RemovedFromProjectEvent" | "RenamedTitleEvent" | "ReopenedEvent" | "RepoAccessAuditEntry" | "RepoAddMemberAuditEntry" | "RepoAddTopicAuditEntry" | "RepoArchivedAuditEntry" | "RepoChangeMergeSettingAuditEntry" | "RepoConfigDisableAnonymousGitAccessAuditEntry" | "RepoConfigDisableCollaboratorsOnlyAuditEntry" | "RepoConfigDisableContributorsOnlyAuditEntry" | "RepoConfigDisableSockpuppetDisallowedAuditEntry" | "RepoConfigEnableAnonymousGitAccessAuditEntry" | "RepoConfigEnableCollaboratorsOnlyAuditEntry" | "RepoConfigEnableContributorsOnlyAuditEntry" | "RepoConfigEnableSockpuppetDisallowedAuditEntry" | "RepoConfigLockAnonymousGitAccessAuditEntry" | "RepoConfigUnlockAnonymousGitAccessAuditEntry" | "RepoCreateAuditEntry" | "RepoDestroyAuditEntry" | "RepoRemoveMemberAuditEntry" | "RepoRemoveTopicAuditEntry" | "Repository" | "RepositoryInvitation" | "RepositoryTopic" | "RepositoryVisibilityChangeDisableAuditEntry" | "RepositoryVisibilityChangeEnableAuditEntry" | "RepositoryVulnerabilityAlert" | "ReviewDismissalAllowance" | "ReviewDismissedEvent" | "ReviewRequest" | "ReviewRequestRemovedEvent" | "ReviewRequestedEvent" | "SavedReply" | "SecurityAdvisory" | "SponsorsListing" | "SponsorsTier" | "Sponsorship" | "Status" | "StatusCheckRollup" | "StatusContext" | "SubscribedEvent" | "Tag" | "Team" | "TeamAddMemberAuditEntry" | "TeamAddRepositoryAuditEntry" | "TeamChangeParentTeamAuditEntry" | "TeamDiscussion" | "TeamDiscussionComment" | "TeamRemoveMemberAuditEntry" | "TeamRemoveRepositoryAuditEntry" | "Topic" | "TransferredEvent" | "Tree" | "UnassignedEvent" | "UnlabeledEvent" | "UnlockedEvent" | "UnmarkedAsDuplicateEvent" | "UnpinnedEvent" | "UnsubscribedEvent" | "User" | "UserBlockedEvent" | "UserContentEdit" | "UserStatus" | "VerifiableDomain";
}

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_resolvedBy {
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

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_author_Bot {
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

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_author_User {
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

export type ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_author = ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_author_Bot | ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_author_User;

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_pullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes {
  __typename: "PullRequestReviewComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_author | null;
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
  pullRequestReview: ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes_pullRequestReview | null;
}

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_pageInfo {
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

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments {
  __typename: "PullRequestReviewCommentConnection";
  /**
   * A list of nodes.
   */
  nodes: (ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_nodes | null)[] | null;
  /**
   * Information to aid in pagination.
   */
  pageInfo: ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments_pageInfo;
}

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_nodes {
  __typename: "PullRequestReviewThread";
  id: string;
  /**
   * Whether this thread has been resolved
   */
  isResolved: boolean;
  /**
   * The user who resolved this thread
   */
  resolvedBy: ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_resolvedBy | null;
  /**
   * A list of pull request comments associated with the thread.
   */
  comments: ReviewThreadQuery_node_PullRequest_reviewThreads_nodes_comments;
  /**
   * Indicates whether the current viewer can reply to this thread.
   */
  viewerCanReply: boolean;
}

export interface ReviewThreadQuery_node_PullRequest_reviewThreads_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating backwards, are there more items?
   */
  hasPreviousPage: boolean;
  /**
   * When paginating backwards, the cursor to continue.
   */
  startCursor: string | null;
}

export interface ReviewThreadQuery_node_PullRequest_reviewThreads {
  __typename: "PullRequestReviewThreadConnection";
  /**
   * A list of nodes.
   */
  nodes: (ReviewThreadQuery_node_PullRequest_reviewThreads_nodes | null)[] | null;
  /**
   * Information to aid in pagination.
   */
  pageInfo: ReviewThreadQuery_node_PullRequest_reviewThreads_pageInfo;
}

export interface ReviewThreadQuery_node_PullRequest {
  __typename: "PullRequest";
  /**
   * The list of all review threads for this pull request.
   */
  reviewThreads: ReviewThreadQuery_node_PullRequest_reviewThreads;
}

export type ReviewThreadQuery_node = ReviewThreadQuery_node_AddedToProjectEvent | ReviewThreadQuery_node_PullRequest;

export interface ReviewThreadQuery {
  /**
   * Fetches an object given its ID.
   */
  node: ReviewThreadQuery_node | null;
}

export interface ReviewThreadQueryVariables {
  pullRequestId: string;
  startCursor?: string | null;
}
