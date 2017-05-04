import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/publish';

let _accessToken;

function githubTokenRef(uid) {
  return firebase.database().ref(`githubTokens/${uid}`);
}

function fetchGithubToken(uid) {
  return Observable.create(obs => {
    const ref = githubTokenRef(uid);
    const callback = ref.on('value', snapshot => obs.next(snapshot.val()), err => obs.error(err));
    return () => ref.off('value', callback);
  });
}

function setGithubToken(uid, token) {
  return githubTokenRef(uid).set(token);
}

export async function startAuth() {
  const provider = new firebase.auth.GithubAuthProvider();
  provider.addScope('repo');
  provider.setCustomParameters({
    'allow_signup': 'false'
  });

  const result = await firebase.auth().signInWithPopup(provider);
  _accessToken = result.credential.accessToken;
  return setGithubToken(result.user.uid, result.credential.accessToken);
}

function authStateChanges() {
  return Observable.create(obs => {
    const unsubscribe = firebase.auth().onAuthStateChanged(
      user => obs.next(user),
      err => obs.error(err),
      () => obs.complete()
    );
    return unsubscribe;
  });
}

export function initialize() {
  const tokens = authStateChanges()
    .switchMap(user => {
      if (user)
        return fetchGithubToken(user.uid);
      else
        return Observable.of(null);
    })
    .publish().refCount();

  tokens.subscribe(accessToken => {
    _accessToken = accessToken;
  });

  return tokens.first();
}

export function getAccessToken() {
  return _accessToken;
}
