import * as firebase from 'firebase';

let _accessToken;

function githubTokenRef(uid) {
  return firebase.database().ref(`githubTokens/${uid}`);
}

function fetchGithubToken(uid) {
  return githubTokenRef(uid).once('value').then(snapshot => snapshot.val());
}

function setGithubToken(uid, token) {
  return githubTokenRef(uid).set(token);
}

async function startAuth() {
  const provider = new firebase.auth.GithubAuthProvider();
  provider.addScope('repo');
  provider.setCustomParameters({
    'allow_signup': 'false'
  });

  const result = await firebase.auth().signInWithPopup(provider);
  _accessToken = result.credential.accessToken;
  return setGithubToken(result.user.uid, result.credential.accessToken);
}

function waitForAuthStateChange() {
  return new Promise((resolve, reject) => {
    let dispose;
    dispose = firebase.auth().onAuthStateChanged(user => {
      resolve(user);
      dispose();
    });
  });
}

export async function initialize() {
  const user = await waitForAuthStateChange();
  if (user) {
    const token = await fetchGithubToken(user.uid);
    if (token) {
      _accessToken = token;
      return;
    }
  }
  return startAuth();
}

export function getAccessToken() {
  return _accessToken;
}
