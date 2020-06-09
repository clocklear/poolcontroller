import axios from 'axios';
import {
  store
} from 'store';
import alert from './alert';
import history from 'modules/history';

const local = axios.create({
  // validateStatus: (status) => {
  //   return status < 500 // throw errors for anything higher than 500
  // }
});

const src = axios.CancelToken.source();

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
    cancelToken: src.token
  };
};

local.interceptors.request.use(requestInterceptor, err => {
  return Promise.reject(err);
});

const responseInterceptor = (res) => {
  return res;
}

local.interceptors.response.use(responseInterceptor, err => {
  if (err.response) {
    // debugger;
    alert(err.response.status);
    if (err.response.status === 401) {
      history.push('/auth/login');
      return;
    }
  } else {
    return Promise.reject(err);
  }
});

export default local;
