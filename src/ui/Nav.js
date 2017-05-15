import React, { Component } from 'react';
import { Popover, Position } from '@blueprintjs/core';
import g from 'glamorous';
import { css } from 'glamor';
import Inbox from '../ui/Inbox';

const inboxPopover = css({
  '& .pt-popover-content': {
    width: '40em',
    minHeight: '20em',
    maxHeight: '30em',
    overflowY: 'auto',
  }
});

export default class Nav extends Component {
  state = {
    isInboxOpen: false,
  };

  render() {
    return (
      <nav className="pt-navbar pt-dark">
        <div className="pt-navbar-group pt-align-left">
          <div className="pt-navbar-heading">Diff Monster</div>
        </div>
        <div className="pt-navbar-group pt-align-right">
          <Popover
            isOpen={this.state.isInboxOpen}
            onInteraction={isOpen => this.setState({ isInboxOpen: isOpen })}
            content={<Inbox onLinkClick={() => this.setState({ isInboxOpen: false })} />}
            position={Position.BOTTOM_RIGHT} 
            popoverClassName={inboxPopover.toString()}
            inheritDarkTheme={false}
          >
            <button className="pt-button pt-minimal pt-icon-inbox">Inbox</button>
          </Popover>
          <button className="pt-button pt-minimal pt-icon-user"></button>
        </div>
      </nav>
    );
  }
}
