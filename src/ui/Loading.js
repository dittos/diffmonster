import React from 'react';
import { Spinner } from '@blueprintjs/core';
import g from 'glamorous';

const Wrapper = g.div({
  '& .pt-spinner': {
    position: 'absolute', // Fix for WebKit (don't know why)
    top: '50%',
    left: '50%',
    marginLeft: '-25px',
    marginTop: '-25px',
  }
});

export default function Loading() {
  return <Wrapper><Spinner /></Wrapper>;
}
