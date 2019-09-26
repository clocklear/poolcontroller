import {
  createBrowserHistory
} from 'history';
import {
  createStore
} from 'redux';
import {
  persistStore,
  persistReducer
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import rootReducer from '../reducers';

export const history = createBrowserHistory();

const persistConfig = {
  key: 'pirelayserver',
  storage,
  whitelist: [''],
};
const reducer = persistReducer(persistConfig, rootReducer);

const configureStore = (initialState = {}) => {
  const store = createStore(reducer, initialState);

  return {
    persistor: persistStore(store),
    store,
  };
};

const {
  store,
  persistor
} = configureStore();

export {
  store,
  persistor
};
