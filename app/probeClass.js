
const path = require('path');

const fs = require('fs');

const logg = require('inspc');

const mkdirp = require('mkdirp');

const requireFromString = require('require-from-string');

const isObject = require('nlab/isObject');

const ms        = require('nlab/ms');

const generate  = ms.generate;

const raw       = ms.raw;

const se = require('nlab/se');

const promiseall = require('nlab/promiseall');

const howMuchTimeLeftToNextTrigger = require('./howMuchTimeLeftToNextTrigger');

const verbose = process.argv.includes('--verbose')

const MIN_INTERVAL_MILLISECONDS = parseInt(process.env.MIN_INTERVAL_MILLISECONDS, 10);

const th = (msg, data) => {

  const e = new Error(`probeClass.js error: ${msg} `);

  if (data) {

    e.details = data;
  }

  return e;
};

let port = (function (PORT, PROTOCOL) {

  let port = parseInt(PORT, 10);

  if (Number.isInteger(port) && port > 0) {

    if (PROTOCOL  === 'https' && port !== 443) {

      return `:${port}`;
    }

    if (PROTOCOL === 'http' && port !== 80) {

      return `:${port}`;
    }
  }

  return '';

}(process.env.PORT, process.env.PROTOCOL));

const type_regex = /^(active|passive)$/;

const int_regex = /^\d+$/;

let dir;

let es;

let io;

let index;

function tool(db) {

  const {
    code,
    description,
    ...dbNoCode
  } = db;

  if ( typeof dir !== 'string' ) {

    throw th(`dir is undefined - first use setup method`);
  }

  // if ( this instanceof tool )
  //   throw new Error( `Can't create instance of function 'probeClass' just use it as a function` );

  if ( ! isObject(dbNoCode) ) {

    throw th(`data is not an object`, dbNoCode);
  }

  if ( ! Number.isInteger(db.id) ) {

    throw th(`data.id is not an integer`, dbNoCode);
  }

  if ( ! type_regex.test(db.type) ) {

    throw th(`data.type don't match '${type_regex}'`, dbNoCode);
  }

  if ( ! (db.code === null || typeof db.code === 'string') ) {

    throw th(`data.code should be null or string`, dbNoCode);
  }

  db = Object.assign({}, db);

  delete db.description;

  let activeTimeoutHandler;

  let currentBinary;

  let probe = null;
  // null - not initialized
  // true - works
  // false - failed

  let log; // rest from running probe

  let lastTimeLoggedInEsUnixtimestampMilliseconds;

  const cls = {
    evaluateFunction: function () {

      let file;

      if (db.id === 0) {

        file = path.resolve(dir, `probe_${db.id}.js`);
      }
      else {

        file = path.resolve(dir, `probe_${db.type}_${db.id}.js`);
      }

      // if ( fs.existsSync(file) ) {
      //
      //   fs.unlinkSync(file);
      // }
      //
      // if ( fs.existsSync(file) ) {
      //
      //   throw th(`Can't remove file '${file}'`);
      // }
      //
      // fs.writeFileSync(file, db.code);

      let tmp;

      try {

        // delete require.cache[file];

        // tmp = require(file);

        tmp = requireFromString(db.code, file);
      }
      catch (e) {

        // delete require.cache[file];

        e = se(e);

        const err = th(`couldn't import file '${file}'`);

        err.details = e;

        throw err;
      }

      // delete require.cache[file];

      const type = typeof tmp;

      if ( type !== 'function' ) {

        throw th(`module declared in file '${file}' should return function but it has returned '${type}'`);
      }

      // I could also check number of arguments that function accept but at the moment I'm not sure how many ...

      return tmp;
    },
    state: function (code = false) {

      const {
        nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds,
        nextTriggerFromNowMilliseconds,
      } = howMuchTimeLeftToNextTrigger({
        intervalMilliseconds: db.interval_ms,
        lastTimeLoggedInEsUnixtimestampMilliseconds,
      });



      // try {
      //
      //   if (db.id == 17) {
      //
      //     logg.dump({
      //       proble_17_status_method: probe,
      //       nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds,
      //       nextTriggerFromNowMilliseconds,
      //       db: (function (db) {
      //
      //         delete db.code;
      //         return db;
      //       }({...db})),
      //       lastTimeLoggedInEsUnixtimestampMilliseconds,
      //     }, 5)
      //
      //   }
      // }
      // catch (e) {
      //
      //   logg.dump({
      //     error_17_status_method: e
      //   })
      // }



      const state = {
        db: code ? db : dbNoCode,
        probe,
        log,
        lastTimeLoggedInEsUnixtimestampMilliseconds,
        nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds,
        nextTriggerFromNowMilliseconds,
      }

      try {

        state.nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds_ISOString= (new Date(state.nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds)).toISOString();
      }
      catch (e) {}

      try {

        state.lastTimeLoggedInEsUnixtimestampMilliseconds_ISOString= (new Date(state.lastTimeLoggedInEsUnixtimestampMilliseconds)).toISOString();
      }
      catch (e) {}

      return state;
    },
    status: this.state,
    destruct: function (opt = {}) {

      const {
        hide_log,
      } = opt || {};

      hide_log || (logg.t(`probe destruct  ${db.enabled ? 'enabled ' : 'disabled'} [${String(db.type).padStart(8, ' ')}:${String(db.id).padStart(6, ' ')}] [project:${String(db.project_id).padStart(6, ' ')}]`));

      clearTimeout(activeTimeoutHandler);

      activeTimeoutHandler  = null;

      probe                 = null;


      // try {
      //
      //   if (db.id == 17) {
      //
      //     logg.dump({
      //       proble_17_reset_destruct_null: probe,
      //     }, 5)
      //
      //   }
      // }
      // catch (e) {
      //
      //   logg.dump({
      //     error_17_reset_destruct_null: e
      //   })
      // }

      log                   = undefined;

      currentBinary         = undefined;

      lastTimeLoggedInEsUnixtimestampMilliseconds = undefined;

      io.emit('probe_status_destruct', db.id);

      // db                    = undefined;

      // logg.dump({
      //   destructed: db.id,
      //   activeTimeoutHandler,
      //   probe,
      //   log,
      //   currentBinary,
      // })
    },
    ioTriggerStatus: function (opt = {}) {

      // if ( typeof esid !== 'string' ) {
      //
      //   throw th(`ioTriggerStatus() esid is not a string`)
      // }

      // if (opt.origin) {
      //
      //   logg.dump({
      //     origin: opt.origin,
      //     id: db.id,
      //   })
      // }

      io.emit('probe_status_update', {
        state: this.state(),
        esid: opt.esid,
        origin: opt.origin
      });
    },
    construct: async function () {

      logg.t(`probe construct ${db.enabled ? 'enabled ' : 'disabled'} [${String(db.type).padStart(8, ' ')}:${String(db.id).padStart(6, ' ')}] [project:${String(db.project_id).padStart(6, ' ')}]       interval: ${ms(db.interval_ms)}`);

      this.destruct({
        hide_log: true,
      });

      currentBinary = cls.evaluateFunction();

      if (db.enabled && db.type === 'active') {

        let intervalMilliseconds = db.interval_ms;

        let nextTriggerFromNowMilliseconds = 0;

        try {

          let row = await this.findLastLog(db.id);

          lastTimeLoggedInEsUnixtimestampMilliseconds = (new Date(row.hits.hits[0]._source.created)).getTime();

          let nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds;

          ({
            nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds,
            nextTriggerFromNowMilliseconds,
          } = howMuchTimeLeftToNextTrigger({
            intervalMilliseconds,
            lastTimeLoggedInEsUnixtimestampMilliseconds,
          }));

          // logg.dump({
          //   probe_id: db.id,
          //   intervalMilliseconds,
          //   lastTimeLoggedInEsUnixtimestampMilliseconds_________________________________: (new Date(lastTimeLoggedInEsUnixtimestampMilliseconds)).toISOString(),
          //   nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds: (new Date(nextTriggerRelativeToLastEsLogAfterApplyingIntervalUnixtimestampMilliseconds)).toISOString(),
          //   now_________________________________________________________________________: (new Date()).toISOString(),
          //   nextTriggerFromNowMilliseconds,
          // })
        }
        catch (e) {

          logg.dump({
            probe_id: db.id,
            cantextract_lastTimeLoggedInEsUnixtimestampMilliseconds_from_es_for_active: se(e),
          })
        }

        if (nextTriggerFromNowMilliseconds > MIN_INTERVAL_MILLISECONDS) { // no point to trigger it now if we will trigger it in next 1 sec anyway

          ({
            probe,
            ...log
          } = await this.prodRunActive({
            trigger: `nextTriggerFromNowMilliseconds > ${ms(MIN_INTERVAL_MILLISECONDS)}`
          }));

          if ( ! probe ) {

            logg.dump({
              contruct_executing_probe_error_nextTriggerFromNowMilliseconds_gt_1000: probe,
              db: (function (db) {
                delete db.code;
                return db;
              }({...db})),
              log,
            }, 5)
          }

          // try {
          //
          //   if (db.id == 17) {
          //
          //     logg.dump({
          //       proble_17_trigger_smaller: probe,
          //       log,
          //     }, 5)
          //
          //   }
          // }
          // catch (e) {
          //
          //   logg.dump({
          //     error_17_trigger_smaller: e
          //   })
          // }

          // this.ioTriggerStatus()
        }
        else {

          logg.dump({
            probe_id: db.id,
            '(nextTriggerFromNowMilliseconds > 1000)': false,
            action: "ignore onServerStart flag and don't trigger now"
          })
        }

        this.ioTriggerStatus();

        const run = async () => {

          await this.prodRunActiveLog();

          // try {
          //
          //   if (db.id == 17) {
          //
          //     logg.dump({
          //       proble_17_run: probe,
          //       log,
          //     }, 5)
          //
          //   }
          // }
          // catch (e) {
          //
          //   logg.dump({
          //     error_17_run: e
          //   })
          // }

          activeTimeoutHandler = setTimeout(() => run(), intervalMilliseconds);
        }

        activeTimeoutHandler = setTimeout(() => run(), nextTriggerFromNowMilliseconds);
      }

      if (db.enabled && db.type === 'passive') {

        let minus = 0;

        let row;

        try {

          row = await this.findLastLog(db.id);

          lastTimeLoggedInEsUnixtimestampMilliseconds = (new Date(row.hits.hits[0]._source.created)).getTime();

          minus = (new Date()).getTime() - lastTimeLoggedInEsUnixtimestampMilliseconds;
        }
        catch (e) {

          if ( ! (typeof row.hits !== 'undefined' && String(e) === `TypeError: Cannot read property '_source' of undefined`) ) {

            logg.dump({
              probe_id: db.id,
              cantextract_lastTimeLoggedInEsUnixtimestampMilliseconds_from_es_for_passive: se(e),
            })
          }
        }

        try {

          ({
            probe,
            log,
          } = row.hits.hits[0]._source);
        }
        catch (e) {

          if ( ! (typeof row.hits !== 'undefined' && String(e) === `TypeError: Cannot read property '_source' of undefined`) ) {

            logg.dump({
              probe_id: db.id,
              cantextract_passive_construct: {
                error: se(e),
                row,
              },
            })
          }
        }

        this.ioTriggerStatus({
          origin: 'passive_contructor'
        });

        if ( probe === false ) {

          return logg.dump({
            passive_probe_id: db.id,
            construct_passive: 'last probe is already false'
          });
        }

        return await this.passiveWatchdog({
          minus,
        });
      }

      this.ioTriggerStatus({
        origin: 'end_contructor'
      });
    },
    passiveWatchdog: async function (opt = {}) {

      let {
        minus = 0,
        lastEs,
      } = opt || {};

      if (minus < 0) {

        minus = 0;
      }

      clearTimeout(activeTimeoutHandler);

      if ( ! db.enabled ) {

        return logg.dump({
          probe_id: db.id,
          passiveWatchdog: 'disabled - passiveWatchdog not triggered'
        });
      }

      let intervalMillisecondsInitial = db.interval_ms;

      let add = parseInt(intervalMillisecondsInitial * 0.2, 10);

      let max = generate({
        s: 40
      })

      if (add > max) {

        add = max;
      }

      intervalMillisecondsInitial += add;

      let intervalMilliseconds = intervalMillisecondsInitial;

      if (minus) {

        intervalMillisecondsInitial -= minus;
      }

      if (intervalMillisecondsInitial < 0) {

        intervalMillisecondsInitial = 0;
      }

      // logg.dump({
      //   probe_id: db.id,
      //   intervalMillisecondsInitial,
      //   intervalMilliseconds,
      // })

      const run = async () => {

        let created = new Date();

        const _log = {
          error: "probe_auto_timeout",
          timeoutafterlast: ms(intervalMilliseconds),
        };

        const _probe = false;

        try {

          const esresult = await es(`/${index}/_doc/`, {
            body: {
              probe: _probe,
              created: created.toISOString(),
              probe_id: db.id,
              log: _log,
            }
          });

          if ( ! Number.isInteger(esresult.status) || (esresult.status < 200 || esresult.status > 299)) {

            logg.dump({
              probe_id: db.id,
              passiveWatchdog_es_insert_status_error: esresult,
            }, 10)
          }
          else {

            lastTimeLoggedInEsUnixtimestampMilliseconds = created.getTime();

            probe = _probe;

            log = _log;

            logg.t(`probe timeout   ${db.enabled ? 'enabled ' : 'disabled'} [${String(db.type).padStart(8, ' ')}:${String(db.id).padStart(6, ' ')}] [project:${String(db.project_id).padStart(6, ' ')}]       interval: ${ms(intervalMilliseconds)}`);

            this.ioTriggerStatus({
              esid: esresult.body._id,
            })

            return;
          }
        }
        catch (e) {}

        // logg.dump({
        //   watchdog_triggered_intervalMilliseconds___onerror: ms(intervalMilliseconds)
        // })

        activeTimeoutHandler = setTimeout(run, intervalMilliseconds);
      };

      // logg.dump({
      //   watchdog_triggered_intervalMillisecondsInitial: ms(intervalMillisecondsInitial)
      // })
      activeTimeoutHandler = setTimeout(run, intervalMillisecondsInitial);
    },
    passiveEndpoint: async function (req) {

      let password = req.body.password;

      if ( ! password ) {

        password = req.query.password;
      }

      if ( ! password ) {

        password = req.headers['x-password'];
      }

      if ( typeof password !== 'string' ) {

        throw th(`passiveEndpoint(): password is not defined`);
      }

      password = password.trim();

      if (db.type !== 'passive') {

        throw th(`passiveEndpoint(): probe is not passive`);
      }

      if ( ! password ) {

        throw th(`passiveEndpoint(): password is an empty string`);
      }

      if ( db.password !== password ) {

        throw th(`passiveEndpoint(): db.password !== password`);
      }

      verbose && logg.t(`probe           ${db.enabled ? 'enabled ' : 'disabled'} [${String(db.type).padStart(8, ' ')}:${String(db.id).padStart(6, ' ')}] [project:${String(db.project_id).padStart(6, ' ')}] ${String(probe).padEnd(5, ' ')} interval: ${ms(db.interval_ms)}`);

      let data;

      const start = new Date();

      data = await currentBinary(req, {
        PROTOCOL: process.env.PROTOCOL,
        HOST: process.env.HOST,
        PORT: port,
      });

      const execution_time_ms = (new Date()).getTime() - start.getTime();

      ({
        probe,
        ...log
      } = data);

      let created = new Date();

      const body = {
        probe,
        created: created.toISOString(),
        probe_id: db.id,
        execution_time_ms,
        // log: rest,
      };

      if ( ! probe || db.detailed_log && Object.keys(log || {}).length) {

        body.log = log;
      }

      const esresult = await es(`/${index}/_doc/`, {
        body,
      });

      if ( ! Number.isInteger(esresult.status) || (esresult.status < 200 || esresult.status > 299)) {

        logg.dump({
          probe_id: db.id,
          passiveEndpoint_es_insert_status_error: esresult,
        }, 10)
      }
      else {

        lastTimeLoggedInEsUnixtimestampMilliseconds = created.getTime();

        this.ioTriggerStatus({
          esid: esresult.body._id,
        })
      }

      await this.passiveWatchdog({
        lastEs: body
      });
    },
    prodRunActiveLog: async function () {

      let data;

      try {

        const start = new Date();

        data = await this.prodRunActive();

        const execution_time_ms = (new Date()).getTime() - start.getTime();

        let created = new Date();

        ({
          probe,
          ...log
        } = data);

        verbose && logg.t(`probe           ${db.enabled ? 'enabled ' : 'disabled'} [${String(db.type).padStart(8, ' ')}:${String(db.id).padStart(6, ' ')}] [project:${String(db.project_id).padStart(6, ' ')}] ${String(probe).padEnd(5, ' ')} interval: ${ms(db.interval_ms)}`);

        // enabled
        // disabled
        const document = {
          method: 'post',
          body: {
            probe,
            created: created.toISOString(),
            probe_id: db.id,
            execution_time_ms,
          }
        }

        if ( ! probe || db.detailed_log && Object.keys(log || {}).length) {

          document.body.log = log;
        }

        const esresult = await es(`/${index}/_doc/`, document);

        if ( ! Number.isInteger(esresult.status) || (esresult.status < 200 || esresult.status > 299)) {

          logg.dump({
            probe_id: db.id,
            prodRunActiveLog_es_insert_status_error: esresult,
            // document: JSON.stringify(document, null, 4),
          }, 10)
        }
        else {

          lastTimeLoggedInEsUnixtimestampMilliseconds = created.getTime();

          this.ioTriggerStatus({
            esid: esresult.body._id,
          })
        }
      }
      catch (e) {

        logg.dump({
          probe_id: db.id,
          prodRunActiveLog_general_error: se(e),
        })
      }

      return data;
    },
    prodRunActive: async function (opt = {}) {

      const {
        forceRebuild,
        ...rest
      } = opt;


      // try {
      //
      //   if (db.id == 17) {
      //
      //     logg.dump({
      //       proble_17_rest: probe,
      //       rest,
      //     }, 5)
      //
      //   }
      // }
      // catch (e) {
      //
      //   logg.dump({
      //     error_17_rest: e
      //   })
      // }

      let data;

      try {

        if ( forceRebuild || ! currentBinary ) {

          currentBinary = cls.evaluateFunction();
        }

        data = await currentBinary({
          PROTOCOL: process.env.PROTOCOL,
          HOST: process.env.HOST,
          PORT: port,
          ...rest
        });

        if ( ! isObject(data) ) {

          throw new Error(`prodRunActive error: module when executed should return object, it returned '${typeof data}'`);
        }

        if ( typeof data.probe !== 'boolean' ) {

          throw new Error(`prodRunActive error: object returned from module after execution should contain 'probe' key with value of type 'boolean' but returned value type is '${typeof data.probe}'`);
        }

        return data
      }
      catch (e) {

        e = se(e);

        return {
          probe: false,
          error: e,
        }
      }
    },
    findLastLog: async function (probe_id) {

      if ( ! int_regex.test(probe_id) ) {

        throw th(`findLastLog() probe_id don't match ${probe_id}`);
      }

      const response = await es(`/${index}/_search`, {
        body: {
          "query": { "term" : {"probe_id" : probe_id} },
          "sort": { "created": { "order": "desc" } },
          "size": 1
        }
      });

      if ( response.status !== 200 ) {

        throw th(`findLastLog() response.status is not 200`);
      }

      return response.body;
    },
    toJSON: function () {
      return {cls:'probeClass', ...dbNoCode};
    },
  }

  return cls;
}

tool.setup = function (opt) {

  if ( ! isObject(opt) ) {

    throw th(`setup() opt is not an object`);
  }

  ({
    dir,
    es,
    io
  } = opt);

  if (typeof es !== 'function' ) {

    throw th(`setup() es is not defined`);
  }

  if ( !isObject(io)) {

    throw th(`setup() io is not an object`);
  }

  index = es.prefix('watchdog');

  if ( ! fs.existsSync(dir) ) {

    mkdirp.sync(dir);
  }

  if ( ! fs.existsSync(dir) ) {

    throw th(`setup() Can't create directory '${dir}'`);
  }

  // const file = path.resolve(dir, '___xxx.txt');

  // if ( fs.existsSync(file) ) {
  //
  //   fs.unlinkSync(file);
  // }
  //
  // if ( fs.existsSync(file) ) {
  //
  //   throw th(`setup() Can't remove file '${file}' 1`);
  // }

  // fs.writeFileSync(file, '');
  //
  // if ( ! fs.existsSync(file) ) {
  //
  //   throw th(`setup() Can't create file '${file}'`);
  // }
  //
  // fs.unlinkSync(file);
  //
  // if ( fs.existsSync(file) ) {
  //
  //   throw th(`setup() Can't remove file '${file}' 2`);
  // }
}

module.exports = tool;


