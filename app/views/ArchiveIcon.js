
import React from 'react';

import './ArchiveIcon.scss'

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
      className={classnames("archive-icon", className)}
      {...rest}
    >
      <Tippy content={content}>
        <svg
          version="1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
        >
          <rect x="12" y="44" fill="#263238" width="4" height="2"/>
          <rect x="32" y="44" fill="#263238" width="4" height="2"/>
          <path fill="#607D8B" d="M8,41V7c0-2.2,1.8-4,4-4h24c2.2,0,4,1.8,4,4v34c0,2.2-1.8,4-4,4H12C9.8,45,8,43.2,8,41z"/>
          <path fill="#B0BEC5" d="M12,17V8c0-0.6,0.4-1,1-1h22c0.6,0,1,0.4,1,1v9H12z"/>
          <rect x="12" y="19" fill="#B0BEC5" width="24" height="10"/>
          <path fill="#B0BEC5" d="M12,40v-9h24v9c0,0.6-0.4,1-1,1H13C12.4,41,12,40.6,12,40z"/>
          <rect x="20" y="11" fill="#546E7A" width="8" height="2"/>
          <rect x="20" y="23" fill="#546E7A" width="8" height="2"/>
          <rect x="20" y="35" fill="#546E7A" width="8" height="2"/>
        </svg>
      </Tippy>
    </div>
  )
}