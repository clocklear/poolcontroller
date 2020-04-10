import {
  ActionTypes
} from '../constants';

export default {
  login: () => ({
    type: ActionTypes.USER_LOGIN,
  }),

  loginSuccess: accessToken => ({
    type: ActionTypes.USER_LOGIN_SUCCESS,
    payload: {
      accessToken,
    },
  }),

  setUser: user => ({
    type: ActionTypes.SET_USER,
    payload: {
      user,
    },
  }),

  clearUser: () => ({
    type: ActionTypes.CLEAR_USER,
  }),
};
