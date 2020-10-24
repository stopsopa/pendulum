
import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  Fragment,
} from 'react';

import './ProbeLog.scss';

import classnames from 'classnames';

import Textarea from '../../components/Textarea'

import log from 'inspc';

const ms        = require('nlab/ms');

import all from 'nlab/all';

import { formatToTimeZone } from 'date-fns-timezone';

import {
  StoreContext as StoreContextAssoc,
  getStoreAssoc,
  setStoreAssoc,
  setStoreAssocDelete,

  actionFetchFullRangeStats,
  actionFetchSelectionStats,
  actionFetchSelectedLog,
  actionDeleteSelectedLog,

} from '../../_storage/storeAssoc'

const assocKeyFullRange     = 'log_full_range';
const assocKeySelection     = 'log_selection';
const assocKeySelectedLog   = 'log_selected_log';

import DatePicker from "react-datepicker";
// https://usehooks.com/useWindowSize/
function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

import {
  Breadcrumb,
  List,
  Button,
  Icon,
  Form,
  Checkbox,
  Loader,
  Modal,
  Header,
  Dropdown,
  Image,
} from 'semantic-ui-react';

import {
  Link,
  useHistory,
  useLocation,
  useParams,
} from 'react-router-dom';

import {
  StoreContext as StoreContextProjects,

  actionProjectsFormPopulate,
  actionProbesFormPopulate,
  getProbesTestResult,

  getProjectForm,
  getProbesForm,
  getProbesFormErrors,
} from '../../views/Projects/storeProjects'

import {
  notificationsAdd,
} from '../../components/Notifications/storeNotifications';

function offsetDay(date, days) {
  return new Date( date.getTime() + ( 60 * 60 * 24 * days * 1000)   )
}

function rangeBack(date, offset) {

  const list = [];

  for (; offset <= 0 ; offset += 1 ) {

    list.push({
      d: offsetDay(date, offset),
      o: offset,
    })
  }

  return list;
}

function range(date, offset) {

  const abs = Math.abs(offset);

  if (offset < 0) {

    date = offsetDay(date, abs)
  }

  const list = [];

  for (var i = 0 ; i < abs ; i += 1 ) {

    list.push({
      d: offsetDay(date, i),
      o: i + 1,
    })
  }

  return list;
}

function _partOfSvgViewBoxXByPartOfSvgDOMElemWith(viewBoxX, svgDomWith) {
  return x => {
    // return (viewBoxX * (d.o * dayWidth)) / svgDomWith
    return parseInt((viewBoxX * x) / svgDomWith, 10) || 0;
  }
}

// vvvv corelated functions
function percent(width) {
  return x => {
    // return (viewBoxX * (d.o * dayWidth)) / width
    return width ? ((x / width) || 0) : 0;
  }
}
function partOfWidthByWithRatio(width) {
  return percent => {
    return width ? parseInt(percent * width, 10) : 0;
  }
}
// ^^^^ corelated functions

function widthBasedOnDateBuilder(rangeSeconds, viewBoxX, rangeStartDate) {

  // log('rangeSeconds',rangeSeconds,'width',width,'rangeStartDate', rangeStartDate);

  const rangeStartDateTime = rangeStartDate.getTime();

  return function (givenDateString) {

    const xsec = parseInt(((new Date(givenDateString)).getTime() - rangeStartDateTime) / 1000, 10);

    return parseInt((xsec * viewBoxX) / rangeSeconds, 10);

    // const final = parseInt((xsec * width) / rangeSeconds, 10);
    //
    // // log('w type', typeof givenDateString, 'givenDateString', givenDateString, 'xsec', xsec, 'width', width, '(xsec * width)',(xsec * width), 'final', final);
    //
    // return final;
  }
}

function timeOffset(date, seconds) {

  if (seconds < 0) {

    seconds = 0
  }

  return new Date(date.getTime() + (seconds * 1000));
}

function flip(s = {}) {

  if ( s.start && s.end && s.start.date > s.end.date ) {

    return {
      start: s.end,
      end: s.start
    }
  }

  return s;
}

function DateColour({
  date,
  char= ':',
}) {
  return (
    <>
      <span className="date">{formatToTimeZone(date, 'YYYY-MM-DD', {timeZone:'UTC'})}</span>
      {` `}
      <span className="hour">{formatToTimeZone(date, 'HH:mm:ss', {timeZone:'UTC'}).replace(/:/g, char)}</span>
    </>
  )
}

function UTCClock() {
  const [time, setTime] = useState({
    char: ':',
    time: new Date(),
  });
  useEffect(() => {
    let l = true;
    const handler = setInterval(() => {
      setTime({
        char: l ? ' ' : ':',
        time: new Date(),
      });
      l = !l;
    }, 500);
    return () => clearInterval(handler);
  }, []);
  return (
    <span style={{fontFamily:'monospace'}}>[UTC time {<DateColour date={time.time} char={time.char}/>}]</span>
  )
}

export default function ProbeLog() {

  useLocation();

  const history = useHistory();

  const search = new URLSearchParams(location.search);

  function setQueryParam(key, value) {

    value ? search.set(key, value) : search.delete(key);

    const s = search.toString();

    history.push({
      search: s ? ('?' + s) : '',
    });
  }

  const deletemode = search.has('deletemode');

  useContext(StoreContextAssoc);

  useContext(StoreContextProjects);

  let {
    project_id,
    probe_id,
    type,
  } = useParams();

  if ( /^\d+$/.test(project_id) ) {

    project_id = parseInt(project_id, 10);
  }

  if ( /^\d+$/.test(probe_id) ) {

    probe_id = parseInt(probe_id, 10);
  }

  const [ loading, setLoading ] = useState(true);

  const pform = getProjectForm();

  const form = getProbesForm();

  if ( typeof type !== 'string' && form && typeof form.type === 'string') {

    type = form.type
  }

  useEffect(() => {

    const onLoad = ([{
      form,
      errors = {},
      submitted,
    }]) => {

      setLoading(false);

      if (submitted) {

        if (Object.keys(errors).length === 0) {

          history.push(`/${project_id}`);

          notificationsAdd(`Probe '<b>${form.name}</b>' have been ${probe_id ? 'edited': 'created'}`)
        }
        else {

          notificationsAdd(`Validation error has been detected, please check the data in the form and submit again.`, 'error');
        }
      }
    }

    const [a, b] = all([a => a, () => {}], onLoad);

    const probesUnbind = actionProbesFormPopulate({
      project_id,
      probe_id,
      type,
      onLoad: a,
    });

    const projectUnbind = actionProjectsFormPopulate({
      id: project_id,
      onLoad: b,
    });

    return () => {
      probesUnbind();
      projectUnbind();
    }

  }, []);

  const [ viewBoxX, setViewBoxX ] = useState(10080);

  // const viewBoxRatio = 0.05;

  // const [datepickerDate, setDatepickerDate] = useState(new Date());
  const datepickerDate = search.has('datepickerDate') ? (new Date(search.get('datepickerDate'))) : (new Date());
  function setDatepickerDate(datepickerDate) {
    setQueryParam('datepickerDate', datepickerDate.toISOString());
  }

  // const [offset, setOffset] = useState(0);
  const offset = parseInt(search.get('offset'), 10) || 0;
  function setOffset(offset) {
    setQueryParam('offset', offset);
  }



  const [ xy, setXY ] = useState(0)

  // const endDate = offsetDay(datepickerDate, offset);

  const windowSize = useWindowSize();

  const [svgDomWith, setSvgDomWith] = useState(0);

  const svgDOM = useCallback(svgDOM => { // https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
    if (svgDOM !== null) {
      setSvgDomWith(svgDOM.getBoundingClientRect().width);
    }
  }, [windowSize]);

  const rangeSeconds = (60 * 60 * 24 * (Math.abs(offset) + 1));

  const startDateMidnight = new Date(offsetDay(datepickerDate, offset));
  startDateMidnight.setUTCHours(0,0,0,0);


  const [selectedLocked , setSelectedLocked] = useState(false);
  const [selectedStart , setSelectedStart] = useState(false);
  const [selectedEnd , setSelectedEnd] = useState(false);

  const partOfSvgViewBoxXByPartOfSvgDOMElemWith = _partOfSvgViewBoxXByPartOfSvgDOMElemWith(viewBoxX, svgDomWith);

  const p = percent(svgDomWith);

  const partOfSvgDOMElemWidthByWithRatio = partOfWidthByWithRatio(svgDomWith);

  const w = widthBasedOnDateBuilder(rangeSeconds, viewBoxX, startDateMidnight);

  const eraseStats = () => {
    setStoreAssocDelete(assocKeyFullRange);
    setStoreAssocDelete(assocKeySelection);
    setStoreAssocDelete(assocKeySelectedLog);
  };

  useEffect(eraseStats, []);

  useEffect(() => {

    eraseStats();

    const endDate = new Date(datepickerDate);

    endDate.setUTCHours(23, 59, 59, 0);

    return actionFetchFullRangeStats({
      probe_id,
      startDate: startDateMidnight,
      endDate,
      key: assocKeyFullRange
    });
  }, [search.get('datepickerDate'), search.get('offset')]);

  const assocFullRange    = getStoreAssoc(assocKeyFullRange);

  const assocSelection    = getStoreAssoc(assocKeySelection);

  const assocSelectedLog  = getStoreAssoc(assocKeySelectedLog);

  function fetchSelectionData(s) {
    actionFetchSelectionStats({
      probe_id,
      startDate: s.start.date,
      endDate: s.end.date,
      key: assocKeySelection,
    })
  }

  function fetchSelectedLog(log_id) {
    actionFetchSelectedLog({
      log_id,
      key: assocKeySelectedLog,
    })
  }

  const onModalClose = () => {
    setStoreAssocDelete(assocKeySelectedLog)
  }

  const onDeleteLog = log_id => {

    const s = flip({
      start: selectedStart,
      end: selectedEnd,
    });

    actionDeleteSelectedLog({
      log_id,
      probe_id,
      startDate: s.start.date,
      endDate: s.end.date,
      key: assocKeySelection,
    })
  }


  return (
    <div>
      <Breadcrumb>
        <Breadcrumb.Section
          // onClick={loginSignOut}
          size="mini"
          as={Link}
          to="/"
        >Dashboard</Breadcrumb.Section>
        <Breadcrumb.Divider />
        <Breadcrumb.Section
          // onClick={loginSignOut}
          size="mini"
          as={Link}
          to={`/${pform.id}`}
        >{`Project "${pform.name}"`}</Breadcrumb.Section>
        <Breadcrumb.Divider />
        <Breadcrumb.Section>{probe_id && `Logs of ${type} probe "${form.name}"`}</Breadcrumb.Section>
      </Breadcrumb>
      <hr />
      <div className="probe-log">
        {loading ? (
          `Loading...`
        ) : (
          <div>
            <h1>
              <Icon name={(type === 'active') ? `paper plane` : `assistive listening systems`} />
              Logs of {type} probe "{form.name}"

              <Button
                icon="edit"
                content="Edit"
                as={Link}
                to={`/${pform.id}/probe/edit/${form.id}`}
                className="right"
              />
            </h1>

            <div className="chart">

              {/*<input type="range"*/}
              {/*       min="200" max="10080"*/}
              {/*       value={viewBoxX}*/}
              {/*       style={{width: '500px'}}*/}
              {/*       onChange={e => setViewBoxX(e.target.value)}*/}
              {/*/>*/}

              {/*<br />*/}
              <table>
                <tbody>
                <tr>
                  {rangeBack(datepickerDate, -6).map(d => (
                    <td key={d.o}>
                      <Button
                        size="mini"
                        primary={d.o >= offset}

                        onClick={e => {e.preventDefault();
                          setOffset(d.o)
                          // setSelected({})
                          setSelectedStart(null);
                          setSelectedEnd(null);
                          setSelectedLocked(false);
                        }}
                      >
                        {formatToTimeZone(d.d, 'D dddd', {timeZone:'UTC'})}
                      </Button>
                    </td>
                  ))}
                  <td>
                    <Button size="mini" primary className="arrow" onClick={e => {e.preventDefault();
                      setDatepickerDate(offsetDay(datepickerDate, -1))
                      // setSelected({})
                      setSelectedStart(null);
                      setSelectedEnd(null);
                      setSelectedLocked(false);
                    }}>
                      <Icon name='chevron left' />
                    </Button>
                  </td>
                  <td>
                   <DatePicker
                      selected={(function (datepickerDate) {

                        // to make datepicker work in 0 timezone
                        const n = new Date(datepickerDate.getTime() + (1000 * 60 * datepickerDate.getTimezoneOffset()))

                        return n;
                      }(datepickerDate))}
                      onChange={date => setDatepickerDate(date)}
                      dateFormat="yyyy-MM-dd iiii"
                    />
                  </td>
                  <td>
                    <Button size="mini" primary className="arrow right" onClick={e => {e.preventDefault();
                      setDatepickerDate(offsetDay(datepickerDate, 1))
                      // setSelected({})
                      setSelectedStart(null);
                      setSelectedEnd(null);
                      setSelectedLocked(false);
                    }}>
                      <Icon name='chevron right' />
                    </Button>
                  </td>
                  <td>
                    <Button size="mini" primary className="today" onClick={e => {e.preventDefault();
                      setDatepickerDate(new Date())
                      // setSelected({})
                      setSelectedStart(null);
                      setSelectedEnd(null);
                      setSelectedLocked(false);
                    }}>
                      Today
                    </Button>
                  </td>
                </tr>

                </tbody>
              </table>
              <table className="timetable">
                <tbody>
                <tr>
                  <td>
                    <UTCClock />
                    {` `}
                    <DateColour date={timeOffset(startDateMidnight, parseInt(rangeSeconds * xy, 10))} />
                  </td>
                  <td></td>
                  {(function (s) {
                    return (
                      <>
                        <td>
                          {s && s.start && <DateColour date={s.start.date}/>}
                          {s.end && ` - `}
                          {s && s.end && <DateColour date={s.end.date}/>}
                        </td>
                        <td></td>
                        <td>{s && s.start && s.end && ms(Math.abs(s.start.date - s.end.date))}</td>
                      </>
                    )
                  }(flip({
                    start: selectedStart,
                    end: selectedEnd,
                  })))}
                </tr>
                </tbody>
              </table>
              {(function ({
                viewBoxX,
                viewBoxY,
                dayWidth,
                s,
              }) {
                return (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      // viewBox={`0 0 ${viewBoxX} ${parseInt(viewBoxX * viewBoxRatio, 10)}`}
                      viewBox={`0 0 ${viewBoxX} ${viewBoxY}`}
                      ref={svgDOM}
                      onMouseDown={e => {
                        // setSelected(s);
                        setSelectedStart({
                          date: timeOffset(startDateMidnight, parseInt(rangeSeconds * xy, 10) || 0),
                          x: xy
                        });
                        setSelectedEnd(null);
                        setSelectedLocked(false);
                        log('onMouseDown')
                      }}
                      onMouseMove={e => {

                        setXY(p(e.nativeEvent.offsetX)) // ???

                        if ( ! selectedStart || selectedLocked ) {
                          log('onMouseMove return')
                          return
                        }

                        setSelectedEnd({
                          date: timeOffset(startDateMidnight, parseInt(rangeSeconds * xy, 10) || 0),
                          x: xy
                        });

                        // log('onMouseMove')
                      }}
                      onMouseUp={e => {
                        if ( selectedStart && selectedEnd && selectedStart.date == selectedEnd.date) {

                          setSelectedStart(null);
                          setSelectedEnd(null);
                          setSelectedLocked(false);
                          log('same reset')
                          return;
                        }

                        setSelectedLocked(true);

                        fetchSelectionData(flip({
                          start: selectedStart,
                          end: selectedEnd,
                        }))
                        // log('onMouseUp')
                      }}
                    >
                      {assocFullRange && assocFullRange.map((d, i) => {
                        const x = w(d.f);
                        return (
                          <rect
                            key={i}
                            width={(function (x) {
                              return x < 5 ? 5 : x;
                            }(w(d.t) - x))}

                            height="380"
                            y="20"

                            x={x}
                            fill={d.p ? '#65dcb5' : '#e65424'}
                          />
                        );
                      })}
                      {s.start && s.end && (
                        <rect
                          width={partOfSvgViewBoxXByPartOfSvgDOMElemWith(partOfSvgDOMElemWidthByWithRatio(s.end.x) - partOfSvgDOMElemWidthByWithRatio(s.start.x))}
                          height="230"
                          y="170"
                          x={partOfSvgViewBoxXByPartOfSvgDOMElemWith(partOfSvgDOMElemWidthByWithRatio(s.start.x))}
                          // fill="blue"
                          stroke="#3e7c48"
                          fill="url(#brush_pattern)"
                        />
                      )}
                      {range(startDateMidnight, Math.abs(offset) + 1).map(d => (
                        <Fragment key={d.d.toISOString()}>
                          <rect width="5" height="70" x={partOfSvgViewBoxXByPartOfSvgDOMElemWith((d.o - 1) * dayWidth) - 5} y="420" fill="black"></rect>
                          <text x={partOfSvgViewBoxXByPartOfSvgDOMElemWith((d.o - 1) * dayWidth) - 5} y="470"> &nbsp; {formatToTimeZone(d.d, 'D dddd', {timeZone:'UTC'})}</text>
                        </Fragment>
                      ))}
                      <rect
                        width="10"

                        // height="380"
                        // y="20"

                        height="230"
                        y="170"
                        x={partOfSvgViewBoxXByPartOfSvgDOMElemWith(partOfSvgDOMElemWidthByWithRatio(xy))}
                        fill="green"
                      />

                      <defs>
                        <pattern id="brush_pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                          <path className="visx-pattern-line" d="M 0,60 l 60,-60" stroke="#3e7c48" strokeWidth="3"
                                strokeLinecap="square" shapeRendering="auto"></path>
                          {/*https://airbnb.io/visx/brush*/}
                        </pattern>
                      </defs>
                    </svg>
                  </>
                )
              }({
                viewBoxX,
                viewBoxY: 500,
                dayWidth: parseInt(svgDomWith / (Math.abs(offset) + 1), 10),
                s: (flip({
                  start: selectedStart,
                  end: selectedEnd,
                }))
              }))}
            </div>

            <div className="list">
              {assocSelection === null && (<div style={{textAlign:'center'}}>Loading...</div>)}

              {Array.isArray(assocSelection) && (assocSelection.length ? (
                <table className="probes_logs_selection">
                  <thead>
                  <tr>
                    <th></th>
                    <th>Id</th>
                    <th>Date</th>
                    <th>probe</th>
                    {deletemode && <th>actions</th>}
                  </tr>
                  </thead>
                  <tbody>
                  {assocSelection.map((r, i) => {
                    return (
                      <tr key={i} className={classnames('select_log', {
                        error: !r.p,
                      })} onClick={() => fetchSelectedLog(r.id)}>
                        <th>{i + 1}</th>
                        <td>{r.id}</td>
                        <td>
                          <DateColour date={r.f} />
                        </td>
                        <td>
                          <Icon color={r.p ? `green` : `red`} name={r.p ? `check` : `x`}/>
                        </td>
                        {deletemode && <td className="actions">
                          <Button size="mini" color="red" icon="trash" onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();

                            onDeleteLog(r.id)
                          }}/>
                        </td>}
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
              ) : <span><Icon name="search"/> No results found</span>)}
            </div>

            <a href="" onClick={e => {
              e.preventDefault();

              var k = (function (p, h, k) {
                p.has(k) ? p.delete(k) : p.set(k, '');
                p = String(p);
                p ? (p = '?' + p) : (p = '');
                location.href = (location.href.split('#')[0]).split('?')[0] + p + h;
              }(new URLSearchParams(location.search), location.hash, 'deletemode'))
              
            }}>delete mode</a>


            <Modal
              onClose={onModalClose}
              // onOpen={e => {
              //   e && e.preventDefault();
              //   setTestModal(true)
              // }}
              open={Boolean(assocSelectedLog)}
              closeOnEscape={true}
              closeOnDimmerClick={true}
              // trigger={<Button className="test-code">Run code</Button>}
              // size="fullscreen"
            >
              <Modal.Header>Log</Modal.Header>
              <Modal.Content scrolling>
                <Textarea
                  className="textarea-code"
                  autoComplete="nope"
                  defaultValue={JSON.stringify((assocSelectedLog || "No result yet"), null, 4)}
                  spellCheck={false}
                  correct={10}
                />
              </Modal.Content>
              <Modal.Actions>
                <Button color='black' onClick={onModalClose}>
                  Close
                </Button>
              </Modal.Actions>
            </Modal>


          </div>
        )}
      </div>
    </div>
  );
}


