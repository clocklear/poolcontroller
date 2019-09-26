// import { ActionTypes } from '../constants';

const initialState = {
  // accessToken: '',
  // email: '',
  // firstName: '',
  // lastName: '',
  // isFetching: false,
  // isAuthenticated: false,
};

const sample = (state = initialState, action = {}) => {
  switch (action.type) {
    // case ActionTypes.USER_LOGIN_SUCCESS:
    //   return {
    //     ...state,
    //     accessToken: action.payload.accessToken,
    //     isAuthenticated: true,
    //   };
    // case ActionTypes.SET_USER:
    //   return {
    //     ...state,
    //     ...action.payload.user,
    //   };
    default:
      return state;
  }
};

export default sample;
