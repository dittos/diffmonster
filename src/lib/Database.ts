import * as firebase from 'firebase';
import { Observable } from 'rxjs';

function getFirebaseUid(): string | null {
  const user = firebase.auth().currentUser;
  return user && user.uid;
}

function refValues<T>(ref: firebase.database.Reference): Observable<T> {
  return Observable.create((obs: any) => {
    const callback = (snapshot: firebase.database.DataSnapshot | null, err: string | null | undefined) => {
      if (err) {
        obs.error(err);
        return;
      }
      obs.next(snapshot!.val());
    };
    ref.on('value', callback);
    return () => ref.off('value', callback);
  });
}

function reviewStatesRef(pullRequestId: string): firebase.database.Reference {
  return firebase.database().ref(`reviewStates/${pullRequestId}/${getFirebaseUid()}`);
}

export function observeReviewStates(pullRequestId: string): Observable<{[fileId: string]: boolean}> {
  return refValues(reviewStatesRef(pullRequestId));
}

export function setReviewState(pullRequestId: string, fileId: string, reviewState: boolean): Promise<any> {
  return reviewStatesRef(pullRequestId).child(fileId).set(reviewState);
}
