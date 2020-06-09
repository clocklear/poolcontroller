import React from 'react';
import PropTypes from 'prop-types';
import { Pane } from 'evergreen-ui';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { withRouter } from 'react-router';
import sizes from 'react-sizes';
import Controller from './Controller';
import { Login, Logout, AccessDenied, Header } from 'components';
import { Auth0Receiver } from 'components/auth';
import auth0 from 'auth0-js';
import config from 'modules/config';
import jwt from 'jsonwebtoken';

const auth0Client = new auth0.WebAuth({
  domain: config.auth0.domain,
  clientID: config.auth0.clientId,
  audience: config.auth0.audience,
  redirectUri: config.auth0.redirectUri,
});

class App extends React.Component {
  static propTypes = {
    user: PropTypes.shape({
      accessToken: PropTypes.string,
      workspace: PropTypes.string,
    }).isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.isInvalid = this.isInvalid.bind(this);
    this.logout = this.logout.bind(this);
  }

  isAuthenticated() {
    const {
      user: { accessToken },
    } = this.props;
    // No token means we are unauthenticated
    return accessToken !== '';
  }

  isInvalid() {
    const { user } = this.props;
    if (!user) return true;
    const { accessToken } = user;
    if (!accessToken) return true;
    // Basic check against expiration time
    const decodedToken = jwt.decode(accessToken, { complete: true });
    const dateNow = new Date().getTime();
    const expAt = decodedToken.payload.exp * 1000;
    return expAt < dateNow;
  }

  logout() {
    // Logout of auth0
    auth0Client.logout({
      returnTo: `${config.auth0.logoutReturnToUri}`,
    });
  }

  render() {
    const isAuthenticated = this.isAuthenticated();
    const { user } = this.props;
    const isInvalid = this.isInvalid();

    return (
      <Pane margin="auto" maxWidth={800} padding={16}>
        {!isInvalid && (
          <Header
            user={user}
            onLogout={this.logout}
            isAuthenticated={isAuthenticated}
          />
        )}
        <Switch>
          <Route path="/callbacks/auth0">
            <Auth0Receiver />
          </Route>
          <Route path="/auth/login">
            <Login />
          </Route>
          <Route path="/auth/logout">
            <Logout />
          </Route>
          {isInvalid && (
            <Route>
              <AccessDenied onLogout={this.logout}></AccessDenied>
            </Route>
          )}
          {!isAuthenticated && <Redirect to="/auth/login" />}
          {isAuthenticated && (
            <Route>
              <Controller />
            </Route>
          )}
        </Switch>
      </Pane>
    );
  }
}

const mapSizesToProps = ({ width }) => ({
  isMobile: width && width < 480,
});

const mapStateToProps = (state) => {
  return { user: state.user };
};

let app = withRouter(App);
app = sizes(mapSizesToProps)(app);
app = connect(mapStateToProps)(app);
export default app;
