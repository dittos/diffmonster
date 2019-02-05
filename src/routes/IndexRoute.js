import React from 'react';
import { Link } from 'react-router-dom';
import { AnchorButton, Button, Intent, Colors, Tooltip, Position } from '@blueprintjs/core';
import { isAuthenticated, startAuth } from '../lib/GithubAuth';
import Nav from '../ui/Nav';
import config from '../config';
import Styles from './IndexRoute.module.css';

// eslint-disable-next-line
const bookmarkletUrl = `javascript:void(location.href='${config.url}#'+(location.host==='github.com'?location.pathname:'/'))`;

const isFirefox = /Firefox/.exec(navigator.userAgent);

export default class IndexRoute extends React.Component {
  render() {
    return (
      <div style={{ flex: 1, overflow: 'auto', background: Colors.DARK_GRAY3 }} className="pt-dark">
        <div className={Styles.Container}>
          <h1 className={Styles.Title}>Welcome</h1>

          <p className="pt-running-text">
            <strong>Diff Monster</strong> is a tool for reviewing GitHub Pull
            Requests—especially big ones.
          </p>

          <div className={Styles.Cards}>
            <div className="pt-card">
              <h5><span className="pt-icon-large pt-icon-locate" /> Open pull request by GitHub URL</h5>
              <form className="pt-control-group" onSubmit={this._onSubmit}>
                <input
                  type="text"
                  className="pt-input pt-fill"
                  placeholder="https://github.com/owner/repo/pull/123 OR owner/repo#123"
                  ref={el => this._urlInput = el}
                />
                <Button type="submit" intent={Intent.PRIMARY} text="Go" />
              </form>

              <p className="pt-text-muted">
                or, try some{' '}
                <Link to="/facebook/react/pull/9580">example</Link>{' '}
                <Link to="/kubernetes/kubernetes/pull/46669">pull</Link>{' '}
                <Link to="/square/okhttp/pull/3207">requests</Link>.
              </p>
            </div>
          </div>

          <div className={Styles.Cards}>
            <div className="pt-card">
              <h5><span className="pt-icon-large pt-icon-bookmark" /> Install Bookmarklet</h5>

              <p>Drag the link to your bookmarks bar, then use it in GitHub pull request page.</p>

              <div className={Styles.ButtonContainer}>
                <Tooltip content="Drag me" position={Position.BOTTOM}>
                  <AnchorButton
                    intent={Intent.PRIMARY}
                    iconName="bookmark"
                    text="Open in Diff Monster"
                    href={bookmarkletUrl}
                    onClick={this._showBookmarkletNotice}
                    disabled={isFirefox}
                  />
                </Tooltip>
                
                {isFirefox && (
                  <p className="pt-text-muted">
                    <span className="pt-icon-standard pt-icon-warning-sign" />{' '}
                    The bookmarklet won't work on Firefox due to CSP of github.com.{' '}
                    <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=866522" target="_blank" rel="noopener noreferrer">Learn more...</a>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={Styles.Cards}>
            <div className="pt-card">
              <h5><span className="pt-icon-large pt-icon-inbox" /> Use Inbox</h5>
              <p>See PRs you need to review in one place. (requires login)</p>
              <div className={Styles.ButtonContainer}>
              {isAuthenticated() ?
                <Button
                  intent={Intent.SUCCESS}
                  iconName="inbox"
                  text="Open Inbox"
                  onClick={() => Nav.isInboxOpen.next(true)}
                /> :
                <div>
                  <Button
                    intent={Intent.PRIMARY}
                    iconName="log-in"
                    text="Login with GitHub"
                    onClick={startAuth}
                  />
                  <p className="pt-text-muted">
                    We never send or store your GitHub access token to server!<br />
                    <a href="https://github.com/dittos/diffmonster/blob/716396c/src/lib/GithubAuth.js#L47" target="_blank" rel="noopener noreferrer">
                      It'll be stored inside <code>localStorage</code>.
                    </a>
                  </p>
                </div>
              }
              </div>
            </div>
          </div>

          <div style={{ paddingTop: "20px", textAlign: "center" }} className="pt-text-muted">
            <p>
              Built by <a href="https://github.com/dittos">@dittos</a>
              {' · '}
              <a href="https://github.com/dittos/diffmonster">Project page</a>
            </p>
            <code>{window.BUILD_INFO || 'dev mode'}</code>
          </div>
        </div>
      </div>
    );
  }

  _onSubmit = event => {
    event.preventDefault();
    const url = this._urlInput.value;
    const urlMatch = /https?:\/\/github\.com\/(.+?)\/(.+?)\/pull\/([0-9]+)/.exec(url);
    if (urlMatch) {
      const [, owner, repo, number] = urlMatch;
      this.props.history.push(`/${owner}/${repo}/pull/${number}`);
    } else {
      const shorthandMatch = /(.+?)\/(.+?)#([0-9]+)/.exec(url);
      if (shorthandMatch) {
        const [, owner, repo, number] = shorthandMatch;
        this.props.history.push(`/${owner}/${repo}/pull/${number}`);
      } else {
        alert('Invalid format :(');
      }
    }
  };

  _showBookmarkletNotice = event => {
    event.preventDefault();
    alert('Drag it to your bookmarks bar!');
  };
}
