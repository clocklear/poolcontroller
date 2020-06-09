import React from 'react';
import ReactDOM from 'react-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { App } from './containers';
import { persistor, store } from './store';
import { Router } from 'react-router-dom';
import history from 'modules/history';

import './index.css';

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Router history={history}>
        <App />
      </Router>{' '}
    </PersistGate>{' '}
  </Provider>,
  document.getElementById('root')
);
