/**
 * Environment Specific Configurations
 */
const config = {
  production: {
    apiRoot: "/api",
    auth0: {
      audience: 'poolcontroller-production-lockleartech-com',
      clientId: 'nGygsp5QXEDZ4TpGrq2k7qs3a7erUcJF',
      redirectUri: 'https://poolcontroller.lockleartech.com/callbacks/auth0',
      logoutReturnToUri: 'https://poolcontroller.lockleartech.com/auth/logout',
      domain: 'lockleartech.auth0.com',
    },
  },
  development: {
    apiRoot: "/api",
    auth0: {
      audience: 'poolcontroller-development-lockleartech-com',
      clientId: 'nGygsp5QXEDZ4TpGrq2k7qs3a7erUcJF',
      redirectUri: 'http://localhost:3001/callbacks/auth0',
      logoutReturnToUri: 'http://localhost:3001/auth/logout',
      domain: 'lockleartech.auth0.com',
    },
  },
};

export default config[process.env.NODE_ENV];
