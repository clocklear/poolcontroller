import React from 'react';
import PropTypes from 'prop-types';
import { Pane, Heading, Switch } from 'evergreen-ui';

class RelayStates extends React.Component {
  static propTypes = {
    relays: PropTypes.arrayOf(
      PropTypes.shape({
        relay: PropTypes.number,
        name: PropTypes.string,
        state: PropTypes.number,
      })
    ).isRequired,
    toggleRelayState: PropTypes.func.isRequired,
  };

  render() {
    const { relays, toggleRelayState } = this.props;

    return (
      <>
        {relays.map(r => (
          <Pane
            key={r.relay}
            display="flex"
            padding={16}
            background="tint2"
            borderRadius={3}
            marginY={16}>
            <Pane flex={1} alignItems="center" display="flex">
              <Heading size={600}>{r.name}</Heading>
            </Pane>
            <Pane>
              <Switch
                height={24}
                checked={r.state === 1}
                onChange={e => toggleRelayState(r.relay)}
              />
            </Pane>
          </Pane>
        ))}
      </>
    );
  }
}

export default RelayStates;
