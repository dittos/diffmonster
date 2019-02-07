import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Popover, Position, Intent, Button, Menu, MenuItem, Tooltip, Navbar, Alignment, Icon } from '@blueprintjs/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import Inbox from './Inbox';
import { getUserInfo, signOut, startAuth } from '../lib/GithubAuth';
import Styles from './Nav.module.css';

export default class Nav extends Component {
  static isInboxOpen = new BehaviorSubject(false);

  private _subscription: Subscription | null = null;

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
      <Navbar className="bp3-dark">
        <Navbar.Group align={Alignment.LEFT} style={{ marginLeft: "-8px" }}>
          <Link to="/" className="bp3-navbar-heading bp3-button bp3-minimal">
            <span className="bp3-button-text">Diff Monster</span>
            <Icon icon="help" />
          </Link>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          {user && <Popover
            content={<Inbox />}
            position={Position.BOTTOM_RIGHT} 
            popoverClassName={Styles.InboxPopover}
            inheritDarkTheme={false}
            isOpen={this.state.isInboxOpen}
            onInteraction={nextOpenState => Nav.isInboxOpen.next(nextOpenState)}
          >
            <Tooltip content="Inbox" position={Position.BOTTOM}>
              <Button
                className="bp3-minimal"
                icon="inbox"
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
              className="bp3-minimal"
              icon="user"
              text={user.login}
            />
          </Popover>}
          {!user && <Button
            intent={Intent.PRIMARY}
            icon="log-in"
            text="Login with GitHub"
            onClick={startAuth}
          />}
        </Navbar.Group>
      </Navbar>
    );
  }
}
