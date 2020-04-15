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
    this.logout = this.logout.bind(this);
  }

  isAuthenticated() {
    const {
      user: { accessToken },
    } = this.props;
    return accessToken !== '';
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
    const { isInvalid } = user;

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
          <Route path="/callbacks/auth0" component={Auth0Receiver} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/logout" component={Logout} />
          {isInvalid && (
            <Route
              render={(props) => (
                <AccessDenied {...props} onLogout={this.logout}></AccessDenied>
              )}
            />
          )}
          {!isAuthenticated && <Redirect to="/auth/login" />}
          {isAuthenticated && <Route component={Controller} />}
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
