import React, { Component } from 'react';
import { Popover, Position, Intent, Button, Menu, MenuItem } from '@blueprintjs/core';
import { css } from 'glamor';
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
  render() {
    const user = getUserInfo();

    return (
      <nav className="pt-navbar pt-dark">
        <div className="pt-navbar-group pt-align-left">
          <div className="pt-navbar-heading">Diff Monster</div>
        </div>
        <div className="pt-navbar-group pt-align-right">
          {user && <Popover
            content={<Inbox />}
            position={Position.BOTTOM_RIGHT} 
            popoverClassName={inboxPopover.toString()}
            inheritDarkTheme={false}
          >
            <Button
              className="pt-minimal"
              iconName="inbox"
            />
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
