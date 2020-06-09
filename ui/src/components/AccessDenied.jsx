import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Pane, Heading, Text } from 'evergreen-ui';

const accessDenied = (props) => {
  const { onLogout } = props;
  return (
    <Pane
      display="flex"
      elevation={3}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height={400}>
      <Icon icon="ban-circle" color="danger" size={128} marginBottom={32} />
      <Heading size={600}>Access Denied</Heading>
      <Text size={500}>You shouldn't be here</Text>
      <Button marginTop={32} onClick={onLogout} height={40}>
        Go Away
      </Button>
    </Pane>
  );
};

accessDenied.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default accessDenied;
