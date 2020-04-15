import axios from 'axios';
import {
  store
} from 'store';
import alert from './alert';

const local = axios.create();

const requestInterceptor = config => {
  const {
    user: {
      accessToken
    },
  } = store.getState();

  return {
    ...config,
    headers: {
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
    },
  };
};

local.interceptors.request.use(requestInterceptor, err => {
  return Promise.reject(err);
});

const responseInterceptor = res => res;

local.interceptors.response.use(responseInterceptor, err => {
  if (err.response) {
    alert(err.response.status);
  }
  return Promise.reject(err);
});

export default local;
