import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/publish';
import 'rxjs/add/operator/first';
import { refValues, githubTokenRef } from './FirebaseRefs';

let _accessToken;

export async function startAuth() {
  const provider = new firebase.auth.GithubAuthProvider();
  provider.addScope('repo');
  provider.setCustomParameters({
    'allow_signup': 'false'
  });

  const result = await firebase.auth().signInWithPopup(provider);
  _accessToken = result.credential.accessToken;
  return githubTokenRef(result.user.uid).set(result.credential.accessToken);
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
        return refValues(githubTokenRef(user.uid));
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
