import React from 'react';

import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Alert, Pane, Spinner } from 'evergreen-ui';

import userActions from 'actions/user';
import api from 'modules/api';

class Auth0Receiver extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: undefined,
      errorDescription: undefined,
    };
  }

  async componentDidMount() {
    const { dispatch } = this.props;
    const code = this.getQueryString('code');
    let error = this.getQueryString('error');
    let errorDescription = this.getQueryString('error_description');

    if (code) {
      const result = await api.auth.auth0Exchange(code);
      const { accessToken, profile } = result;
      dispatch(userActions.loginSuccess(accessToken));
      dispatch(userActions.setUser(profile));
    }

    if (error) {
      error = this.underscoreCaseToSentenceCase(error);
      errorDescription = window.decodeURIComponent(errorDescription);
    }

    this.setState({
      loading: false,
      error,
      errorDescription,
    });
  }

  getQueryString = (param) => {
    const reg = new RegExp(`[?&]${param}=([^&#]*)`, 'i');
    const string = reg.exec(window.location.href);
    return string ? string[1] : null;
  };

  underscoreCaseToSentenceCase = (val) => {
    return val
      .replace(/_/g, ' ')
      .split(' ')
      .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
      .join(' ');
  };

  render() {
    const { loading, error, errorDescription } = this.state;

    if (error) {
      return (
        <Alert intent="danger" title={error} marginBottom={32}>
          {errorDescription}
        </Alert>
      );
    }
    return loading ? (
      <Pane
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={400}>
        <Spinner />
      </Pane>
    ) : (
      <Redirect to="/" />
    );
  }
}

export default connect()(Auth0Receiver);
