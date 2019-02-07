import React from 'react';
import querystring from 'querystring';
import { RouteComponentProps } from 'react-router';

export default function withQueryParams<P extends RouteComponentProps>(Component: React.ComponentType<P>) {
  return (props: P) => {
    const queryParams = querystring.parse(props.location.search.substring(1));
    return <Component {...props} queryParams={queryParams} />;
  };
}
