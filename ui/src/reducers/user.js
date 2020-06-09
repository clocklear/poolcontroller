import {
  ActionTypes
} from '../constants';

const initialState = {
  accessToken: '',
  email: '',
  firstName: '',
  lastName: '',
  isFetching: false,
  isAuthenticated: false,
  isInvalid: false,
  permissions: [],
};

const user = (state = initialState, action = {}) => {
  switch (action.type) {
    case ActionTypes.USER_LOGIN_SUCCESS:
      return {
        ...state,
        accessToken: action.payload.accessToken,
          isAuthenticated: true,
      };
    case ActionTypes.SET_USER:
      return {
        ...state,
        ...action.payload.user,
      };
    case ActionTypes.SET_USER_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload.permissions,
      };
    case ActionTypes.SET_INVALID_USER:
      return {
        ...state,
        isInvalid: true,
      };
    case ActionTypes.CLEAR_USER:
      return initialState;
    default:
      return state;
  }
};

export default user;
