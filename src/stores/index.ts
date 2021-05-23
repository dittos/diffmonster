import { createStore, applyMiddleware, compose, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import getInitialState from './getInitialState';
import pullRequestReducer, { pullRequestEpic, PullRequestAction } from './PullRequestStore';
import commentReducer, { commentEpic, CommentAction } from './CommentStore';
import reviewReducer, { reviewEpic, ReviewAction } from './ReviewStore';
import { AppState, PullRequestLoadedState } from './types';

export * from './types';

export type AppAction = PullRequestAction | ReviewAction | CommentAction;

const rootEpic = combineEpics(
  pullRequestEpic,
  reviewEpic as any, // XXX
  commentEpic,
);

function reducer(state: AppState = getInitialState(), action: AppAction) {
  state = pullRequestReducer(state, action as PullRequestAction);
  state = commentReducer(state as PullRequestLoadedState, action as CommentAction);
  state = reviewReducer(state as PullRequestLoadedState, action as ReviewAction);
  return state;
}

export function configureStore(): Store<AppState> {
  const epicMiddleware = createEpicMiddleware();
  const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(reducer, composeEnhancers(
    applyMiddleware(epicMiddleware)
  ));
  epicMiddleware.run(rootEpic);
  return store;
}