import React from 'react';
import { Icon, Pane, Heading, Text } from 'evergreen-ui';

export default () => {
  return (
    <Pane
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height={400}>
      <Icon icon="ban-circle" color="danger" size={128} marginBottom={32} />
      <Heading size={600}>Access Denied</Heading>
      <Text size={500}>You shouldn't be here</Text>
    </Pane>
  );
};
