import React from 'react';
import PropTypes from 'prop-types';
import userActions from 'actions/user';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Pane, Spinner } from 'evergreen-ui';

class Logout extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  async componentDidMount() {
    // Destroy our local user
    const { dispatch } = this.props;
    dispatch(userActions.clearUser());
    this.setState({
      loading: false,
    });
  }

  render() {
    const { loading } = this.state;
    return loading ? (
      <Pane
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={400}>
        <Spinner />
      </Pane>
    ) : (
      <Redirect to="/auth/login" />
    );
  }
}
export default connect()(Logout);
