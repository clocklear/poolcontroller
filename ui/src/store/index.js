import {
  createStore,
  applyMiddleware,
  compose
} from 'redux';
import {
  persistStore,
  persistReducer
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import rootReducer from 'reducers';

const persistConfig = {
  key: 'pirelayserver',
  storage,
  whitelist: ['user'],
};

/**
 * This is for the redux dev tools extension
 */
const composeEnhancers = (process.env.ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

const enhancer = composeEnhancers(
  applyMiddleware()
  // other store enhancers if any
);

const reducer = persistReducer(persistConfig, rootReducer);

const configureStore = (initialState = {}) => {
  const store = createStore(reducer, initialState, enhancer);

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
