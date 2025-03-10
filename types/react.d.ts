/// <reference types="react" />

declare module 'react/jsx-runtime' {
  export { jsx, jsxs } from 'react/jsx-runtime';
}

declare module 'react/jsx-dev-runtime' {
  export { jsx, jsxs } from 'react/jsx-dev-runtime';
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 