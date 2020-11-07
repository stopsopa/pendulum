
import React from 'react';

import './ServiceIcon.scss'

import classnames from 'classnames';

// https://github.com/atomiks/tippyjs-react#default-tippy
import Tippy from '@tippyjs/react';

export default (props = {}) => {

  const {
    className,
    content = '',
    ...rest
  } = props;

  // https://icons8.github.io/flat-color-icons/
  return (
    <div
      className={classnames("service-icon", className)}
      {...rest}
    >
      <Tippy content={content}>
        <svg
          version="1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className={classnames("service-icon", className)}
          {...rest}
        >
          <path fill="#F44336" d="M21.2,44.8l-18-18c-1.6-1.6-1.6-4.1,0-5.7l18-18c1.6-1.6,4.1-1.6,5.7,0l18,18c1.6,1.6,1.6,4.1,0,5.7l-18,18 C25.3,46.4,22.7,46.4,21.2,44.8z"/>
          <path fill="#fff" d="M21.6,32.7c0-0.3,0.1-0.6,0.2-0.9c0.1-0.3,0.3-0.5,0.5-0.7c0.2-0.2,0.5-0.4,0.8-0.5s0.6-0.2,1-0.2 s0.7,0.1,1,0.2c0.3,0.1,0.6,0.3,0.8,0.5c0.2,0.2,0.4,0.4,0.5,0.7c0.1,0.3,0.2,0.6,0.2,0.9s-0.1,0.6-0.2,0.9s-0.3,0.5-0.5,0.7 c-0.2,0.2-0.5,0.4-0.8,0.5c-0.3,0.1-0.6,0.2-1,0.2s-0.7-0.1-1-0.2s-0.5-0.3-0.8-0.5c-0.2-0.2-0.4-0.4-0.5-0.7S21.6,33.1,21.6,32.7z M25.8,28.1h-3.6L21.7,13h4.6L25.8,28.1z"/>
        </svg>
      </Tippy>
    </div>
  )
}