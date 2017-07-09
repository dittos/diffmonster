import { createStore, applyMiddleware, compose } from 'redux';
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
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(reducer, composeEnhancers(
    applyMiddleware(epicMiddleware)
  ));
  return store;
}