import React from 'react';
import ReactDOM from 'react-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { App } from './containers';
import { persistor, store } from './store';
import { BrowserRouter as Router } from 'react-router-dom';

import './index.css';

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Router>
        <App />
      </Router>{' '}
    </PersistGate>{' '}
  </Provider>,
  document.getElementById('root')
);
