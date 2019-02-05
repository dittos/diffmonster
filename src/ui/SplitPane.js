import React from 'react';
import Styles from './SplitPane.module.css';

export default class SplitPane extends React.Component {
  constructor(initialProps) {
    super(initialProps);
    this._sideWidth = initialProps.sideWidth;
  }
  
  render() {
    return (
      <div className={Styles.Container}>
        <div className={Styles.SidePanel} ref={el => this._sideEl = el} style={{width: this._sideWidth + 'px'}}>
          {this.props.side}
        </div>
        <div className={Styles.ResizeHandle} onMouseDown={this._beginResize} />
        <div className={Styles.MainPanel}>
          {this.props.main}
        </div>
      </div>
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