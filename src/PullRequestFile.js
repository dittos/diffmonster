import React from 'react';

export default function PullRequestFile({ file }) {
  return <pre>{file.patch}</pre>;
}
