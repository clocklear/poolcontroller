import React from 'react';
import { Button } from 'evergreen-ui';

import config from 'modules/config';

/**
 * Since we use auth0 for authentication,
 * this components acts as a redirect.
 */
class Auth0Sender extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  onClick = () => {
    const scopes = ['openid', 'profile', 'email'];
    const href = `${config.auth0.url}/authorize?response_type=code&client_id=${
      config.auth0.clientId
    }&redirect_uri=${config.auth0.redirectUri}&audience=${
      config.auth0.audience
    }&state=poolcontroller&scope=${scopes.join(' ')}`;
    window.location.href = href;
  };

  render() {
    return (
      <Button
        appearance="primary"
        height={48}
        onClick={this.onClick}
        {...this.props}>
        Log in with Auth0
      </Button>
    );
  }
}

export default Auth0Sender;
