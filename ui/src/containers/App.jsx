import React from 'react';
import PropTypes from 'prop-types';
import { Pane } from 'evergreen-ui';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { withRouter } from 'react-router';
import sizes from 'react-sizes';
import Controller from './Controller';
import { Login, AccessDenied, Header } from 'components';
import { Auth0Receiver } from 'components/auth';
import userActions from 'actions/user';
import api from 'modules/api';

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
    api.auth.logout();
    // and destroy our local user
    const { dispatch } = this.props;
    dispatch(userActions.clearUser());
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
          {isInvalid && <Route component={AccessDenied} />}
          <Route path="/auth/login" component={Login} />
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
