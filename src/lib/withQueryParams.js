import React from 'react';
import querystring from 'querystring';

export default function withQueryParams(Component) {
  return (props) => {
    const queryParams = querystring.parse(props.location.search.substring(1));
    return <Component {...props} queryParams={queryParams} />;
  };
}
