import React from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
  Pane,
  Popover,
  Menu,
  Heading,
  Button,
  Position,
} from 'evergreen-ui';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';
import sizes from 'react-sizes';
import Nav from './Nav';
import { Login, AccessDenied } from 'components';
import { Auth0Receiver } from 'components/auth';
import userActions from 'actions/user';

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
    const { dispatch } = this.props;
    dispatch(userActions.clearUser());
  }

  render() {
    const isAuthenticated = this.isAuthenticated();
    const { user } = this.props;
    const { isInvalid } = user;

    return (
      <Pane margin="auto" maxWidth={800} padding={16}>
        <Pane display="flex">
          {isAuthenticated && !isInvalid && (
            <>
              <Pane flex={1} alignItems="center" display="flex">
                {!this.props.isMobile && (
                  <Heading paddingY={16} size={700}>
                    Pool Controller
                  </Heading>
                )}
              </Pane>
              <Pane display="flex" justifyContent="center" alignItems="center">
                <Popover
                  position={Position.BOTTOM_RIGHT}
                  content={
                    <Menu>
                      <Menu.Group>
                        <Menu.Item icon="log-out" onSelect={this.logout}>
                          Logout
                        </Menu.Item>
                      </Menu.Group>
                    </Menu>
                  }>
                  <Button
                    appearance="minimal"
                    height={50}
                    paddingLeft={5}
                    paddingRight={5}>
                    <Avatar src={user.picture} name={user.name} size={40} />
                  </Button>
                </Popover>
              </Pane>
            </>
          )}
        </Pane>
        <Switch>
          <Route path="/callbacks/auth0" component={Auth0Receiver} />
          {isInvalid && <Route component={AccessDenied} />}
          {isAuthenticated && <Route component={Nav} />}
          {!isAuthenticated && <Route component={Login} />}
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
