import { createStore, applyMiddleware } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import getInitialState from './store/getInitialState';
import pullRequestReducer, { pullRequestEpic } from './store/PullRequestStore';
import commentReducer, { commentEpic } from './store/CommentStore';
import reviewReducer, { reviewEpic } from './store/ReviewStore';

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