/// <reference types="react-scripts" />

declare module 'http-link-header' {
  declare function parse(link: string);
}

declare module 'marked' {
  export default function(markdown: string, options: any);
}