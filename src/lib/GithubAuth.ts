import * as firebase from 'firebase';
import { Observable } from 'rxjs';
import { getAuthenticatedUser, UserDTO } from './Github';
import { first } from 'rxjs/operators';

let _accessToken: string | undefined;
let _userInfo: UserDTO | undefined;

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
  localStorage.removeItem(tokenLocalStorageKey(auth.currentUser!.uid));
  auth.signOut();
  window.location.reload(); // TODO: without refresh
}

function firebaseAuthStateChanges(): Observable<firebase.User> {
  return Observable.create((obs: any) => {
    const unsubscribe = firebase.auth().onAuthStateChanged(
      user => obs.next(user),
      err => obs.error(err),
      () => obs.complete()
    );
    return unsubscribe;
  });
}

function tokenLocalStorageKey(uid: string): string {
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
    const user = await firebaseAuthStateChanges().pipe(first()).toPromise();
    if (user) {
      accessToken = localStorage.getItem(tokenLocalStorageKey(user.uid));
    }
  }

  if (accessToken) {
    _accessToken = accessToken;
    _userInfo = await getAuthenticatedUser().toPromise();
  }
}

export function getAccessToken(): string | undefined {
  return _accessToken;
}

export function getUserInfo(): UserDTO | undefined {
  return _userInfo;
}

export function isAuthenticated(): boolean {
  return Boolean(_userInfo);
}
