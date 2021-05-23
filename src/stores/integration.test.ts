import { Store } from "redux";
import { of, Subject } from "rxjs";
import { MockLink } from "@apollo/client/testing";
import { AppAction, configureStore } from ".";
import { apollo, getPullRequestAsDiff } from "../lib/Github";
import { addReviewComment, addSingleComment, deleteComment, editComment, reviewThreadQuery } from "./CommentStore";
import { fetch, pullRequestQuery } from "./PullRequestStore";
import { AppState, PullRequestCommentDTO, PullRequestDTO, PullRequestReviewDTO, PullRequestReviewThreadDTO } from "./types";
import { addCommentMutation, addReplyCommentMutation, approveMutation, deleteCommentMutation, editCommentMutation, submitReviewMutation } from "./GithubMutations";
import { PullRequestReviewCommentState, PullRequestReviewEvent, PullRequestReviewState } from "../__generated__/globalTypes";
import { approve, submitReview } from "./ReviewStore";
import { getUserInfo } from "../lib/GithubAuth";

jest.mock('../lib/Github', () => {
  const actualModule = jest.requireActual('../lib/Github');
  return {
    ...actualModule,
    getPullRequestAsDiff: jest.fn(),
  };
});
jest.mock('../lib/GithubAuth');

describe('integeration test', () => {
  let store: Store<AppState>;
  let mockLink: MockLink;

  beforeEach(() => {
    store = configureStore();
    mockLink = new MockLink([]);
    apollo.setLink(mockLink);
    (getPullRequestAsDiff as jest.MockedFunction<any>).mockReturnValue(of(""));
    (getUserInfo as jest.MockedFunction<any>).mockReturnValue({ login: 'dittos' });
  });

  afterEach(() => {
    apollo.stop();
    apollo.clearStore();
  });

  async function prepareStore(pullRequest: PullRequestDTO, reviewThreads: PullRequestReviewThreadDTO[] = []): Promise<AppState> {
    mockLink.addMockedResponse({
      request: {
        query: pullRequestQuery,
        variables: {
          owner: 'dittos',
          repo: 'diffmonster',
          number: 67,
          author: 'dittos',
        },
      },
      result: {
        data: {"repository":{"pullRequest":pullRequest,"__typename":"Repository"}},
      }
    });
    mockLink.addMockedResponse({
      request: {
        query: reviewThreadQuery,
        variables: {
          pullRequestId: pullRequest.id,
          startCursor: null,
        }
      },
      result: {
        data: {
          node: {
            __typename: 'PullRequest',
            reviewThreads: {
              nodes: reviewThreads,
              pageInfo: {
                hasPreviousPage: false,
                startCursor: null,
              }
            }
          }
        }
      }
    });

    store.dispatch<AppAction>(fetch({
      owner: 'dittos',
      repo: 'diffmonster',
      number: 67,
    }));

    return await waitForNewState(store);
  }

  describe('fetch', () => {
    it('without any review', async () => {
      const pullRequest = newPullRequest();
      const state = await prepareStore(pullRequest);
      
      expect(state.status).toStrictEqual('success');
      expect(state.pullRequest).toStrictEqual(pullRequest);
      expect(state.reviewOpinion).toStrictEqual('none');
      expect(state.hasPendingReview).toBeFalsy();
    });
    
    it('no opinion and pending review', async () => {
      const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
      const pullRequest = newPullRequest({ pendingReview });
      const state = await prepareStore(pullRequest);
      
      expect(state.status).toStrictEqual('success');
      expect(state.pullRequest).toStrictEqual(pullRequest);
      expect(state.reviewOpinion).toStrictEqual('none');
      expect(state.hasPendingReview).toBeTruthy();
    });
    
    it('approved and pending review', async () => {
      const opinionatedReview = newReview({ state: PullRequestReviewState.APPROVED });
      const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
      const pullRequest = newPullRequest({ opinionatedReview, pendingReview });
      const state = await prepareStore(pullRequest);
      
      expect(state.status).toStrictEqual('success');
      expect(state.pullRequest).toStrictEqual(pullRequest);
      expect(state.reviewOpinion).toStrictEqual('approved');
      expect(state.hasPendingReview).toBeTruthy();
    });
    
    it('approved', async () => {
      const opinionatedReview = newReview({ state: PullRequestReviewState.APPROVED });
      const pullRequest = newPullRequest({ opinionatedReview });
      const state = await prepareStore(pullRequest);
      
      expect(state.status).toStrictEqual('success');
      expect(state.pullRequest).toStrictEqual(pullRequest);
      expect(state.reviewOpinion).toStrictEqual('approved');
      expect(state.hasPendingReview).toBeFalsy();
    });
    
    it('changes requested', async () => {
      const opinionatedReview = newReview({ state: PullRequestReviewState.CHANGES_REQUESTED });
      const pullRequest = newPullRequest({ opinionatedReview });
      const state = await prepareStore(pullRequest);
      
      expect(state.status).toStrictEqual('success');
      expect(state.pullRequest).toStrictEqual(pullRequest);
      expect(state.reviewOpinion).toStrictEqual('changesRequested');
      expect(state.hasPendingReview).toBeFalsy();
    });
    
    it('dismissed', async () => {
      const opinionatedReview = newReview({ state: PullRequestReviewState.DISMISSED });
      const pullRequest = newPullRequest({ opinionatedReview });
      const state = await prepareStore(pullRequest);
      
      expect(state.status).toStrictEqual('success');
      expect(state.pullRequest).toStrictEqual(pullRequest);
      expect(state.reviewOpinion).toStrictEqual('none');
      expect(state.hasPendingReview).toBeFalsy();
    });
  });
  
  it('add single comment', async () => {
    const pullRequest = newPullRequest();
    await prepareStore(pullRequest);

    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const comment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [comment] });
    const submittedReview = { ...pendingReview, state: PullRequestReviewState.COMMENTED };
    const action = addSingleComment({
      body: 'hello',
      position: {
        position: 1,
        line: 23,
        side: 'RIGHT'
      },
      path: 'package.json',
    }, new Subject());
    mockLink.addMockedResponse({
      request: {
        query: addCommentMutation,
        variables: {
          input: {
            body: action.payload.body,
            line: action.payload.position.line,
            side: action.payload.position.side,
            path: action.payload.path,
            pullRequestId: pullRequest.id,
          },
          submitNow: true,
          submitInput: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          },
        }
      },
      result: {
        data: {
          "addPullRequestReviewThread":{"thread":thread,"__typename":"AddPullRequestReviewThreadPayload"},
          "submitPullRequestReview":{"pullRequestReview":submittedReview,"__typename":"SubmitPullRequestReviewPayload"}
        }
      }
    });
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments.nodes![0]!.state = PullRequestReviewCommentState.SUBMITTED;
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('adding single comment does not change opinion', async () => {
    const opinionatedReview = newReview({ state: PullRequestReviewState.APPROVED });
    const pullRequest = newPullRequest({ opinionatedReview });
    await prepareStore(pullRequest);

    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const comment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [comment] });
    const submittedReview = { ...pendingReview, state: PullRequestReviewState.COMMENTED };
    const action = addSingleComment({
      body: 'hello',
      position: {
        position: 1,
        line: 23,
        side: 'RIGHT'
      },
      path: 'package.json',
    }, new Subject());
    mockLink.addMockedResponse({
      request: {
        query: addCommentMutation,
        variables: {
          input: {
            body: action.payload.body,
            line: action.payload.position.line,
            side: action.payload.position.side,
            path: action.payload.path,
            pullRequestId: pullRequest.id,
          },
          submitNow: true,
          submitInput: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          },
        }
      },
      result: {
        data: {
          "addPullRequestReviewThread":{"thread":thread,"__typename":"AddPullRequestReviewThreadPayload"},
          "submitPullRequestReview":{"pullRequestReview":submittedReview,"__typename":"SubmitPullRequestReviewPayload"}
        }
      }
    });
    store.dispatch(action);
    const state = await waitForNewState(store);
    expect(state.reviewOpinion).toStrictEqual('approved');
  });
  
  it('add single comment reply', async () => {
    const latestReview = newReview({ state: PullRequestReviewState.COMMENTED });
    const pullRequest = newPullRequest();
    const parentComment = newComment({ review: latestReview });
    const thread = newThread({ comments: [parentComment] });
    await prepareStore(pullRequest, [thread]);

    const action = addSingleComment({
      body: 'hello',
      position: {
        position: 1,
        line: 23,
        side: 'RIGHT'
      },
      path: 'package.json',
      replyContext: {
        thread,
        comment: parentComment,
      }
    }, new Subject());
    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const comment = newComment({ review: pendingReview });
    const submittedReview = { ...pendingReview, state: PullRequestReviewState.COMMENTED };
    mockLink.addMockedResponse({
      request: {
        query: addReplyCommentMutation,
        variables: {
          input: {
            pullRequestId: pullRequest.id,
            commitOID: pullRequest.headRefOid,
            body: action.payload.body,
            path: action.payload.path,
            position: action.payload.position.position,
            inReplyTo: parentComment.id,
          },
          submitNow: true,
          submitInput: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          },
        }
      },
      result: {
        data: {
          "addPullRequestReviewComment":{"comment":comment,"__typename":"AddPullRequestReviewCommentPayload"},
          "submitPullRequestReview":{"pullRequestReview":submittedReview,"__typename":"SubmitPullRequestReviewPayload"}
        }
      }
    });
    store.dispatch(action);
    const state = await waitForNewState(store);
    comment.state = PullRequestReviewCommentState.SUBMITTED;
    thread.comments!.nodes!.push(comment);
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('start new draft review', async () => {
    const pullRequest = newPullRequest();
    await prepareStore(pullRequest);

    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const comment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [comment] });
    const action = addReviewComment({
      body: 'hello',
      position: {
        position: 1,
        line: 23,
        side: 'RIGHT'
      },
      path: 'package.json',
    }, new Subject());
    mockLink.addMockedResponse({
      request: {
        query: addCommentMutation,
        variables: {
          input: {
            body: action.payload.body,
            line: action.payload.position.line,
            side: action.payload.position.side,
            path: action.payload.path,
            pullRequestId: pullRequest.id,
          },
          submitNow: false,
          submitInput: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          },
        }
      },
      result: {
        data: {
          "addPullRequestReviewThread":{"thread":thread,"__typename":"AddPullRequestReviewThreadPayload"},
        }
      }
    });
    store.dispatch(action);
    const state = await waitForNewState(store);
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeTruthy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('start new draft review with reply', async () => {
    const latestReview = newReview({ state: PullRequestReviewState.COMMENTED });
    const pullRequest = newPullRequest();
    const parentComment = newComment({ review: latestReview });
    const thread = newThread({ comments: [parentComment] });
    await prepareStore(pullRequest, [thread]);
    
    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const action = addReviewComment({
      body: 'hello',
      position: {
        position: 1,
        line: 23,
        side: 'RIGHT'
      },
      path: 'package.json',
      replyContext: {
        thread,
        comment: parentComment,
      }
    }, new Subject());
    const comment = newComment({ review: pendingReview });
    mockLink.addMockedResponse({
      request: {
        query: addReplyCommentMutation,
        variables: {
          input: {
            pullRequestId: pullRequest.id,
            commitOID: pullRequest.headRefOid,
            body: action.payload.body,
            path: action.payload.path,
            position: action.payload.position.position,
            inReplyTo: parentComment.id,
          },
          submitNow: false,
          submitInput: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          },
        }
      },
      result: {
        data: {
          "addPullRequestReviewComment":{"comment":comment,"__typename":"AddPullRequestReviewCommentPayload"},
        }
      }
    });
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments!.nodes!.push(comment);
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeTruthy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('add comment to existing draft review', async () => {
    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const pullRequest = newPullRequest({ pendingReview });
    const existingComment = newComment({ review: pendingReview });
    const existingThread = newThread({ comments: [existingComment] });
    await prepareStore(pullRequest, [existingThread]);

    const action = addReviewComment({
      body: 'hello',
      position: {
        position: 1,
        line: 23,
        side: 'RIGHT'
      },
      path: 'package.json',
    }, new Subject());
    const comment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [comment] });
    mockLink.addMockedResponse({
      request: {
        query: addCommentMutation,
        variables: {
          input: {
            body: action.payload.body,
            line: action.payload.position.line,
            side: action.payload.position.side,
            path: action.payload.path,
            pullRequestId: pullRequest.id,
          },
          submitNow: false,
          submitInput: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          },
        }
      },
      result: {"data":{"addPullRequestReviewThread":{"thread":thread,"__typename":"AddPullRequestReviewThreadPayload"}}}
    });
    store.dispatch(action);
    const state = await waitForNewState(store);
    expect(state.reviewThreads).toStrictEqual([existingThread, thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeTruthy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('add reply comment to existing draft review', async () => {
    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const pullRequest = newPullRequest({ pendingReview });
    const parentComment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [parentComment] });
    await prepareStore(pullRequest, [thread]);

    const action = addReviewComment({
      body: 'hello',
      position: {
        position: 1,
        line: 23,
        side: 'RIGHT'
      },
      path: 'package.json',
      replyContext: {
        thread,
        comment: parentComment,
      }
    }, new Subject());
    const comment = newComment({ review: pendingReview });
    mockLink.addMockedResponse({
      request: {
        query: addReplyCommentMutation,
        variables: {
          input: {
            pullRequestId: pullRequest.id,
            commitOID: pullRequest.headRefOid,
            body: action.payload.body,
            path: action.payload.path,
            position: action.payload.position.position,
            inReplyTo: parentComment.id,
          },
          submitNow: false,
          submitInput: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          },
        }
      },
      result: {"data":{"addPullRequestReviewComment":{"comment":comment,"__typename":"AddPullRequestReviewCommentPayload"}}}
    });
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments!.nodes!.push(comment);
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeTruthy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('delete comment', async () => {
    const latestReview = newReview({ state: PullRequestReviewState.COMMENTED });
    const pullRequest = newPullRequest();
    const comment = newComment({ review: latestReview });
    const thread = newThread({ comments: [comment] });
    await prepareStore(pullRequest, [thread]);

    const action = deleteComment(comment);
    mockLink.addMockedResponse({
      request: {
        query: deleteCommentMutation,
        variables: {
          commentId: comment.id,
        }
      },
      result: {"data":{"deletePullRequestReviewComment":{"pullRequestReview":latestReview,"__typename":"DeletePullRequestReviewCommentPayload"}}}
    })
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments!.nodes = [];
    expect(state.reviewThreads).toStrictEqual([thread]); // TODO: should remove empty threads
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('delete comment but keep thread', async () => {
    const latestReview = newReview({ state: PullRequestReviewState.COMMENTED });
    const pullRequest = newPullRequest();
    const comment = newComment({ review: latestReview });
    const otherComment = newComment({ review: latestReview });
    const thread = newThread({ comments: [comment, otherComment] });
    await prepareStore(pullRequest, [thread]);

    const action = deleteComment(comment);
    mockLink.addMockedResponse({
      request: {
        query: deleteCommentMutation,
        variables: {
          commentId: comment.id,
        }
      },
      result: {"data":{"deletePullRequestReviewComment":{"pullRequestReview":latestReview,"__typename":"DeletePullRequestReviewCommentPayload"}}}
    })
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments!.nodes = [otherComment];
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('delete last pending comment', async () => {
    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const pullRequest = newPullRequest({ pendingReview });
    const comment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [comment] });
    await prepareStore(pullRequest, [thread]);

    const action = deleteComment(comment);
    mockLink.addMockedResponse({
      request: {
        query: deleteCommentMutation,
        variables: {
          commentId: comment.id,
        }
      },
      result: {"data":{"deletePullRequestReviewComment":{"pullRequestReview":pendingReview,"__typename":"DeletePullRequestReviewCommentPayload"}}}
    })
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments!.nodes = [];
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('delete a pending comment', async () => {
    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const pullRequest = newPullRequest({ pendingReview });
    const comment = newComment({ review: pendingReview });
    const otherComment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [comment, otherComment] });
    await prepareStore(pullRequest, [thread]);

    const action = deleteComment(comment);
    mockLink.addMockedResponse({
      request: {
        query: deleteCommentMutation,
        variables: {
          commentId: comment.id,
        }
      },
      result: {"data":{"deletePullRequestReviewComment":{"pullRequestReview":pendingReview,"__typename":"DeletePullRequestReviewCommentPayload"}}}
    })
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments!.nodes = [otherComment];
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeTruthy();
    expect(state.isAddingReview).toBeFalsy();
  });

  it('edit comment', async () => {
    const latestReview = newReview({ state: PullRequestReviewState.COMMENTED });
    const pullRequest = newPullRequest();
    const comment = newComment({ review: latestReview });
    const thread = newThread({ comments: [comment] });
    await prepareStore(pullRequest, [thread]);

    const action = editComment(comment, 'new body', new Subject());
    mockLink.addMockedResponse({
      request: {
        query: editCommentMutation,
        variables: {
          commentId: comment.id,
          body: action.payload.body,
        }
      },
      result: {"data":{"updatePullRequestReviewComment":{"pullRequestReviewComment":{...comment, body: action.payload.body},"__typename":"UpdatePullRequestReviewCommentPayload"}}}
    })
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments!.nodes![0]!.body = action.payload.body;
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('submit review', async () => {
    const pendingReview = newReview({ state: PullRequestReviewState.PENDING });
    const pullRequest = newPullRequest({ pendingReview });
    const comment = newComment({ review: pendingReview });
    const otherComment = newComment({ review: pendingReview });
    const thread = newThread({ comments: [comment, otherComment] });
    await prepareStore(pullRequest, [thread]);

    const action = submitReview();
    const submittedReview = { ...pendingReview, state: PullRequestReviewState.COMMENTED };
    mockLink.addMockedResponse({
      request: {
        query: submitReviewMutation,
        variables: {
          input: {
            pullRequestId: pullRequest.id,
            event: PullRequestReviewEvent.COMMENT,
          }
        }
      },
      result: {"data":{"submitPullRequestReview":{"pullRequestReview":submittedReview,"__typename":"SubmitPullRequestReviewPayload"}}}
    })
    store.dispatch(action);
    const state = await waitForNewState(store);
    thread.comments.nodes!.forEach(comment => comment!.state = PullRequestReviewCommentState.SUBMITTED);
    expect(state.reviewThreads).toStrictEqual([thread]);
    expect(state.reviewOpinion).toStrictEqual('none');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
  
  it('approve', async () => {
    const pullRequest = newPullRequest();
    let state = await prepareStore(pullRequest, []);
    expect(state.reviewOpinion).toStrictEqual('none');

    const action = approve();
    const review = newReview({ state: PullRequestReviewState.APPROVED });
    mockLink.addMockedResponse({
      request: {
        query: approveMutation,
        variables: {
          pullRequestId: pullRequest.id,
          commitOID: pullRequest.headRefOid,
        }
      },
      result: {"data":{"addPullRequestReview":{"pullRequestReview":review,"__typename":"AddPullRequestReviewPayload"}}}
    })
    store.dispatch(action);
    state = await waitForNewState(store);
    expect(state.reviewThreads).toStrictEqual([]);
    expect(state.reviewOpinion).toStrictEqual('approved');
    expect(state.hasPendingReview).toBeFalsy();
    expect(state.isAddingReview).toBeFalsy();
  });
});

async function waitForNewState<T>(store: Store<T>): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, 10));
  return store.getState();
}

let nextId = 1;
function generateId() {
  return `${nextId++}`;
}

function newPullRequest({
  opinionatedReview = null,
  pendingReview = null,
}: {
  opinionatedReview?: PullRequestReviewDTO | null,
  pendingReview?: PullRequestReviewDTO | null,
} = {}): PullRequestDTO {
  return {
    "databaseId": 645111258,
    "id": generateId(),
    "url": "https://github.com/dittos/diffmonster/pull/67",
    "baseRefOid": "73e96226e7ee764a4774a2a014e7e043fbfdc1ae",
    "headRefOid": "5ec10414a75dda98afd438ba01c31eabfb75c269",
    "opinionatedReviews": {"nodes": opinionatedReview ? [opinionatedReview] : [], "__typename": "PullRequestReviewConnection"},
    "pendingReviews": {"nodes": pendingReview ? [pendingReview] : [], "__typename": "PullRequestReviewConnection"},
    "__typename": "PullRequest"
  };
}

function newReview({
  state
}: {
  state: PullRequestReviewState
}): PullRequestReviewDTO {
  return {
    "id": generateId(),
    "state": state,
    "__typename": "PullRequestReview"
  };
}

function newThread({
  comments
}: {
  comments: PullRequestCommentDTO[]
}): PullRequestReviewThreadDTO {
  return {
    "id": generateId(),
    "isResolved": false,
    "resolvedBy": null,
    "comments": {
      "nodes": comments,
      "pageInfo": { "hasNextPage": false, "hasPreviousPage": false, "startCursor": "Y3Vyc29yOnYyOpK0MjAyMS0wNS0xOVQxNToyMDoxNlrOJd6crA==", "__typename": "PageInfo" },
      "__typename": "PullRequestReviewCommentConnection"
    },
    "viewerCanReply": true,
    "__typename": "PullRequestReviewThread"
  };
}

function newComment({
  review
}: {
  review: PullRequestReviewDTO
}): PullRequestCommentDTO {
  const state = review.state === PullRequestReviewState.PENDING ? PullRequestReviewCommentState.PENDING : PullRequestReviewCommentState.SUBMITTED;
  return {
    "id": generateId(),
    "author": { "id": 2622, "__typename": "User", "html_url": "https://github.com/dittos", "login": "dittos" },
    "body": "hello",
    "bodyHTML": "<p>hello</p>",
    "path": "package.json",
    "position": 1,
    "state": state,
    "pullRequestReview": review,
    "__typename": "PullRequestReviewComment"
  };
}
