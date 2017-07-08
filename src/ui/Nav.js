import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Popover, Position, Intent, Button, Menu, MenuItem, Tooltip } from '@blueprintjs/core';
import { css } from 'glamor';
import g from 'glamorous';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import Inbox from './Inbox';
import { getUserInfo, signOut, startAuth } from '../lib/GithubAuth';

const inboxPopover = css({
  '& .pt-popover-content': {
    width: '40em',
    minHeight: '20em',
    maxHeight: '30em',
    overflowY: 'auto',
  }
});

export default class Nav extends Component {
  static isInboxOpen = new BehaviorSubject(false);

  state = {
    isInboxOpen: Nav.isInboxOpen.value
  };

  componentDidMount() {
    this._subscription = Nav.isInboxOpen.subscribe(isInboxOpen => this.setState({ isInboxOpen }));
  }

  componentWillUnmount() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  render() {
    const user = getUserInfo();

    return (
      <nav className="pt-navbar pt-dark">
        <g.Div className="pt-navbar-group pt-align-left" marginLeft="-8px">
          <Link to="/" className="pt-navbar-heading pt-button pt-minimal">
            Diff Monster
          </Link>
        </g.Div>
        <div className="pt-navbar-group pt-align-right">
          {user && <Popover
            content={<Inbox />}
            position={Position.BOTTOM_RIGHT} 
            popoverClassName={inboxPopover.toString()}
            inheritDarkTheme={false}
            isOpen={this.state.isInboxOpen}
            onInteraction={nextOpenState => Nav.isInboxOpen.next(nextOpenState)}
          >
            <Tooltip content="Inbox" position={Position.BOTTOM}>
              <Button
                className="pt-minimal"
                iconName="inbox"
              />
            </Tooltip>
          </Popover>}
          {user && <Popover
            content={<Menu>
              <MenuItem text="Sign out" onClick={signOut} />
            </Menu>}
            position={Position.BOTTOM_RIGHT} 
            inheritDarkTheme={false}
          >
            <Button
              className="pt-minimal"
              iconName="user"
              text={user.login}
            />
          </Popover>}
          {!user && <Button
            intent={Intent.PRIMARY}
            iconName="log-in"
            text="Login with GitHub"
            onClick={startAuth}
          />}
        </div>
      </nav>
    );
  }
}
