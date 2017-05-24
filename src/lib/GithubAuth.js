import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/toPromise';
import { getAuthenticatedUser } from './Github';

let _accessToken;
let _userInfo;

export function startAuth() {
  const provider = new firebase.auth.GithubAuthProvider();
  provider.addScope('repo');
  provider.setCustomParameters({
    'allow_signup': 'false'
  });
  firebase.auth().signInWithRedirect(provider);
}

export function signOut() {
  const auth = firebase.auth();
  localStorage.removeItem(tokenLocalStorageKey(auth.currentUser.uid));
  auth.signOut();
  window.location.reload(); // TODO: without refresh
}

function firebaseAuthStateChanges() {
  return Observable.create(obs => {
    const unsubscribe = firebase.auth().onAuthStateChanged(
      user => obs.next(user),
      err => obs.error(err),
      () => obs.complete()
    );
    return unsubscribe;
  });
}

function tokenLocalStorageKey(uid) {
  return `githubTokens/${uid}`;
}

export async function initialize() {
  const result = await firebase.auth().getRedirectResult();

  let accessToken;
  if (result.user) {
    // Redirected
    localStorage.setItem(tokenLocalStorageKey(result.user.uid), result.credential.accessToken);
    accessToken = result.credential.accessToken;
  } else {
    const user = await firebaseAuthStateChanges().first().toPromise();
    if (user) {
      accessToken = localStorage.getItem(tokenLocalStorageKey(user.uid));
    }
  }

  if (accessToken) {
    _accessToken = accessToken;
    _userInfo = await getAuthenticatedUser().toPromise();
  }
}

export function getAccessToken() {
  return _accessToken;
}

export function getUserInfo() {
  return _userInfo;
}

export function isAuthenticated() {
  return Boolean(_userInfo);
}
