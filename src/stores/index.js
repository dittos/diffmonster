import { createStore, applyMiddleware } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import getInitialState from './getInitialState';
import pullRequestReducer, { pullRequestEpic } from './PullRequestStore';
import commentReducer, { commentEpic } from './CommentStore';
import reviewReducer, { reviewEpic } from './ReviewStore';

const rootEpic = combineEpics(
  pullRequestEpic,
  reviewEpic,
  commentEpic,
);

function reducer(state = getInitialState(), action) {
  state = pullRequestReducer(state, action);
  state = commentReducer(state, action);
  state = reviewReducer(state, action);
  return state;
}

export function configureStore() {
  const epicMiddleware = createEpicMiddleware(rootEpic);
  const store = createStore(reducer, applyMiddleware(epicMiddleware));
  return store;
}