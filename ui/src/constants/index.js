/* eslint-disable import/prefer-default-export */
export const ActionTypes = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGIN_SUCCESS: 'USER_LOGIN_SUCCESS',
  USER_LOGIN_FAILURE: 'USER_LOGIN_FAILURE',
  SET_USER: 'SET_USER',
  SET_USER_PERMISSIONS: 'SET_USER_PERMISSIONS',
  SET_INVALID_USER: 'SET_INVALID_USER',
  CLEAR_USER: 'CLEAR_USER',
};

export const Scopes = {
  READ_CONFIG: "read:config",
  READ_EVENTS: "read:events",
  READ_ME: "read:me",
  READ_RELAYS: "read:relays",
  WRITE_CONFIG_SCHEDULES: "write:config.schedules",
  WRITE_RELAY_NAME: "write:relay.name",
  WRITE_RELAY_TOGGLE: "write:relay.toggle",
}
/* eslint-enable import/prefer-default-export */
