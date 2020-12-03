import React from 'react';
import PropTypes from 'prop-types';
import { Relay } from '.';

class RelayList extends React.Component {
  static propTypes = {
    relays: PropTypes.arrayOf(
      PropTypes.shape({
        relay: PropTypes.number,
        name: PropTypes.string,
        state: PropTypes.number,
      })
    ).isRequired,
    toggleRelayState: PropTypes.func.isRequired,
    renameRelay: PropTypes.func.isRequired,
  };

  render() {
    const { relays, toggleRelayState, renameRelay } = this.props;

    return (
      <>
        {relays.map((r) => (
          <Relay
            relay={r}
            toggleState={toggleRelayState}
            rename={renameRelay}
          />
        ))}
      </>
    );
  }
}

export default RelayList;
