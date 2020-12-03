import {
  ActionTypes
} from '../constants';

const userActions = {
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

  setUserPermissions: permissions => ({
    type: ActionTypes.SET_USER_PERMISSIONS,
    payload: {
      permissions
    }
  }),

  setInvalidUser: () => ({
    type: ActionTypes.SET_INVALID_USER,
  }),

  clearUser: () => ({
    type: ActionTypes.CLEAR_USER,
  }),
};

export default userActions;