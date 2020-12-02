
import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useReducer,
} from 'react';

import AceEditor from '../../components/AceEditor/AceEditor'

import NoInput from '../../components/NoInput/NoInput';

import {
  Link,
  useHistory,
  useParams,
} from 'react-router-dom';

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
  Tab,
} from 'semantic-ui-react';

import './MessengersEdit.scss';

import isObject from 'nlab/isObject';

import log from 'inspc';

import {
  StoreContext as StoreContextSocket,
} from '../../_storage/storeSocket';

import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';

import {
  postbox_form_atom,
  postbox_form_error_atom,
} from '../../recoil/postbox';

export default () => {

  const { id } = useParams();

  let {
    state: socket,
  } = useContext(StoreContextSocket);

  const [ form, set_form ] = useRecoilState(postbox_form_atom);

  const [ errors, set_errors ] = useRecoilState(postbox_form_error_atom);

  const [ loading, setLoading ] = useState(true);

  const [ sending, setSending ] = useState(false);

  const editField = (name, value) => set_form({
    ...form,
    [name]: value,
  });

  useEffect(() => {

    const postbox_form_atom_populate = ({
      form,
    }) => {

      set_form(form);

      setLoading(false);

      setSending(false);
    }

    socket.on('postbox_form_atom_populate', postbox_form_atom_populate);

    socket.emit('postbox_form_atom_populate', {
      id,
    });

    return () => {

      socket.off('postbox_form_atom_populate', postbox_form_atom_populate);

      set_form(postbox_form_atom.reset());

      set_errors(postbox_form_error_atom.reset());
    };

  }, [socket.id]);

  function onSubmit() {

    // setSending(true);

    console.log(JSON.stringify(form, null, 4))
    // actionProjectsFormSubmit({
    //   form,
    // });
  }

  return (
    <div className="postbox_form">
      <Breadcrumb>
        <Breadcrumb.Section
          size="mini"
          as={Link}
          to="/messengers"
        >Messengers</Breadcrumb.Section>
        <Breadcrumb.Divider />
        <Breadcrumb.Section>{id ? `Edit messenger ${form.name ? `"${form.name}"` : `...`}`: `Create messenger`}</Breadcrumb.Section>
      </Breadcrumb>


      {loading ? (
        `Loading...`
      ) : (
        <Form onSubmit={onSubmit}
              autoComplete="off"
        >
          <Form.Field
            disabled={loading}
            error={!!errors.name}
          >
            <label>Name</label>
            <input placeholder='Name' value={form.name}
                   onChange={e => editField('name', e.target.value)}
                   autoComplete="nope"
            />
            {errors.name && <div className="error">{errors.name}</div>}
          </Form.Field>
          <Form.Field
            disabled={loading}
            error={!!errors.password}
          >
            <label>Password</label>
            <input placeholder='Password' value={form.password || ''}
                   onChange={e => editField('password', e.target.value)}
                   autoComplete="nope"
            />
            {errors.password && <div className="error">{errors.password}</div>}
          </Form.Field>
          <Form.Field
            disabled={loading}
            error={!!errors.enabled}
          >
            <NoInput
              checked={Boolean(form.enabled)}
              onChange={() => editField('enabled', !form.enabled)}
            >Enabled</NoInput>
            {errors.enabled && <div className="error">{errors.enabled}</div>}
          </Form.Field>
          <Form.Field
            disabled={loading}
            error={!!errors.description}
          >
            <label>Description</label>
            <AceEditor
              mode='python'
              value={form.description || ``}
              onChange={value => editField('description', value)}
            />
            {errors.description && <div className="error">{errors.description}</div>}
          </Form.Field>
          <Form.Field disabled={sending}>
            <Button type='submit'
                    autoComplete="nope"
            >
              {form.id ? 'Save changes' : 'Create'}
            </Button> {sending && `Sending data...`}
          </Form.Field>
        </Form>
      )}
    </div>
  )
}