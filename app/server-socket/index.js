
const log = require('inspc');

module.exports = (...args) => {

  require('./common')(...args);

  require('./projects')(...args);

  require('./probes')(...args);

  require('./logs')(...args);

  require('./logger')(...args);

  require('./users')(...args);

  require('./groups')(...args);

  (function (opt = {}) {

    const {
      socket,
      telegramMiddleware = {}
    } = opt;

    if (telegramMiddleware.expressMiddlewareForward) {

      console.log(`client connected: telegramMiddleware.forward === true: forwarding`)

      let telegramproxy = false;

      try {

        telegramproxy = socket.handshake.query.telegramproxy
      }
      catch (e) {}

      if (telegramproxy) {

        console.log('telegramproxy found')

        require('./telegram')(...args);
      }
      else {

        console.log('telegramproxy not found')
      }

    }
    else {

      console.log(`client connected: telegramMiddleware.forward === false: NOT forwarding`)
    }
  }(...args));

}