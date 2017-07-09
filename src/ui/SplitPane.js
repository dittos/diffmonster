import React from 'react';
import g from 'glamorous';
import { Colors } from '@blueprintjs/core';

const Container = g.div({
  display: 'flex',
  flex: '1',
  overflow: 'auto',
});

const ResizeHandle = g.div({
  cursor: 'ew-resize',
  width: '6px',
});

const Panel = g.div({
  background: Colors.WHITE,
  borderRadius: '3px',
  boxShadow: '0 0 1px rgba(0, 0, 0, 0.2)',
});

const SidePanel = g(Panel)({
  flex: '0 0 auto',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: '0 0 6px 6px',
});

const MainPanel = g(Panel)({
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: '0 6px 6px 0',
});

export default class SplitPane extends React.Component {
  constructor(initialProps) {
    super(initialProps);
    this._sideWidth = initialProps.sideWidth;
  }
  
  render() {
    return (
      <Container>
        <SidePanel innerRef={el => this._sideEl = el} style={{width: this._sideWidth + 'px'}}>
          {this.props.side}
        </SidePanel>
        <ResizeHandle onMouseDown={this._beginResize} />
        <MainPanel>
          {this.props.main}
        </MainPanel>
      </Container>
    );
  }
  
  // Resizing - directly manipulates DOM to bypass React rendering

  _beginResize = event => {
    event.preventDefault(); // prevent text selection

    document.addEventListener('mouseup', this._endResize, false);
    document.addEventListener('mousemove', this._resize, false);
  };

  _resize = event => {
    event.preventDefault(); // prevent text selection

    // FIXME: 6px is left margin but hardcoded
    const minWidth = 200;
    const maxWidth = 800;
    this._sideWidth = Math.min(Math.max(minWidth, event.clientX - 6), maxWidth);
    this._sideEl.style.width = this._sideWidth + 'px';
  };

  _endResize = event => {
    event.preventDefault(); // prevent text selection

    document.removeEventListener('mouseup', this._beginResize);
    document.removeEventListener('mousemove', this._resize);

    this.props.onResizeEnd(this._sideWidth);
  };
}