import React from 'react';
import { Auth0Sender } from 'components/auth';
import { Avatar, Pane } from 'evergreen-ui';
import logo from 'assets/logo.svg';

export default () => {
  return (
    <Pane
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height={400}>
      <Avatar size={256} marginBottom={32} src={logo} />
      <Auth0Sender />
    </Pane>
  );
};
