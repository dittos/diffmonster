import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';

function getFirebaseUid() {
  const user = firebase.auth().currentUser;
  return user && user.uid;
}

function refValues(ref) {
  return Observable.create(obs => {
    const callback = ref.on('value', snapshot => obs.next(snapshot.val()), err => obs.error(err));
    return () => ref.off('value', callback);
  });
}

function reviewStatesRef(pullRequestId) {
  return firebase.database().ref(`reviewStates/${pullRequestId}/${getFirebaseUid()}`);
}

export function observeReviewStates(pullRequestId) {
  return refValues(reviewStatesRef(pullRequestId));
}

export function setReviewState(pullRequestId, fileId, reviewState) {
  return reviewStatesRef(pullRequestId).child(fileId).set(reviewState);
}
