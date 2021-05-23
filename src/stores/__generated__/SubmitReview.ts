/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SubmitPullRequestReviewInput, PullRequestReviewState } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: SubmitReview
// ====================================================

export interface SubmitReview_submitPullRequestReview_pullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * Identifies the current state of the pull request review.
   */
  state: PullRequestReviewState;
}

export interface SubmitReview_submitPullRequestReview {
  __typename: "SubmitPullRequestReviewPayload";
  /**
   * The submitted pull request review.
   */
  pullRequestReview: SubmitReview_submitPullRequestReview_pullRequestReview | null;
}

export interface SubmitReview {
  /**
   * Submits a pending pull request review.
   */
  submitPullRequestReview: SubmitReview_submitPullRequestReview | null;
}

export interface SubmitReviewVariables {
  input: SubmitPullRequestReviewInput;
}
