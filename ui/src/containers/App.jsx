import React from 'react'
import { Pane, Spinner, Switch, Heading } from 'evergreen-ui'
import { connect } from 'react-redux';
import api from '../modules/api'

class App extends React.Component {
  static propTypes = {
    
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      relays: []
    };
    this.refreshRelayState = this.refreshRelayState.bind(this)
    this.toggleRelayState = this.toggleRelayState.bind(this)
  }

  async refreshRelayState() {
    const relays = await api.relays.getRelays();
    this.setState({ relays });
  }

  async componentDidMount() {
    this.refreshRelayState()
  }

  async toggleRelayState(relay) {
    const relays = await api.relays.toggleRelay(relay);
    this.setState({ relays })
  }

  render() {
    const { relays, isLoading } = this.state
    return (
      <Pane padding={32}>
        <Pane margin="auto" maxWidth={800}>
        <Heading paddingX={16} size={800}>
          pirelayserver
        </Heading>
        {isLoading && 
          <Pane display="flex" alignItems="center" justifyContent="center" height={400}>
            <Spinner />
          </Pane>
        }
        {!isLoading && relays.map(r =>
          <Pane key={r.relay} display="flex" padding={16} background="tint2" borderRadius={3} margin={16}>
            <Pane flex={1} alignItems="center" display="flex">
              <Heading size={600}>{r.name}</Heading>
            </Pane>
            <Pane>
              <Switch height={24} checked={r.state === 1} onChange={e => this.toggleRelayState(r.relay)}/>
            </Pane>
          </Pane>
        )}
        </Pane>
      </Pane>
    );
  }
}

const mapStateToProps = state => {
  return {  };
};

export default connect(mapStateToProps)(App);
