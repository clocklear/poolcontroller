import React from 'react'
import { Pane, Spinner, Switch, Heading, Tablist, Tab, Table } from 'evergreen-ui'
import { connect } from 'react-redux';
import Moment from 'react-moment';
import api from '../modules/api';
import sizes from 'react-sizes';

class App extends React.Component {
  static propTypes = {
    
  };

  constructor(props) {
    super(props);
    const tabs = ["Relay States", "Schedules", "Activity Log"];
    this.state = {
      isLoading: true,
      relays: [
        {"relay":1, "name":"Relay 1", "state":0},
        {"relay":2, "name":"Relay 2", "state":1}
      ],
      selectedTab: tabs[0],
      tabs: tabs,
      activity: [
        {
          "stamp": "2019-09-26T21:09:15.043992-04:00",
          "msg": "pirelayserver booted up"
        },
        {
          "stamp": "2019-09-26T21:09:50.32457-04:00",
          "msg": "pirelayserver booted up"
        },
        {
          "stamp": "2019-09-26T21:31:37.038862-04:00",
          "msg": "pirelayserver booted up"
        },
        {
          "stamp": "2019-09-26T21:31:38.666961-04:00",
          "msg": "pirelayserver shut down cleanly"
        },
        {
          "stamp": "2019-09-26T21:31:44.043208-04:00",
          "msg": "pirelayserver booted up"
        }
      ]
    };
    this.refreshRelayState = this.refreshRelayState.bind(this)
    this.toggleRelayState = this.toggleRelayState.bind(this)
  }

  async refreshRelayState() {
    const relays = await api.relays.getRelays();
    this.setState({ relays });
  }

  async refreshActivity() {
    const activity = await api.events.getEvents();
    this.setState({ activity });
  }

  async componentDidMount() {
    this.refreshRelayState()
    this.relayRefreshInterval = setInterval(() => {
      this.refreshRelayState();
    }, 5000);
    this.refreshActivity();
    this.activityRefreshInterval = setInterval(() => {
      this.refreshActivity();
    }, 5000);
    this.setState({ isLoading: false });
  }
  componentWillUnmount() {
    clearInterval(this.relayRefreshInterval);
    clearInterval(this.activityRefreshInterval);
  }

  async toggleRelayState(relay) {
    const relays = await api.relays.toggleRelay(relay);
    this.setState({ relays })
  }

  render() {
    const { relays, isLoading, selectedTab, tabs, activity, momentFormat } = this.state
    const TAB_RELAYSTATES = tabs[0]
    const TAB_SCHEDULES = tabs[1]
    const TAB_ACTIVITYLOG = tabs[2]
    return (
        <Pane margin="auto" maxWidth={800} padding={16}>
          {!this.props.isMobile && 
            <Heading paddingY={16} size={700}>
              PiRelayServer
            </Heading>
          }
          <Tablist marginY={16} flexBasis={240} marginRight={24}>
            {tabs.map((tab, index) => (
              <Tab
                key={tab}
                id={tab}
                onSelect={() => this.setState({ selectedTab: tab })}
                isSelected={tab === selectedTab}
                aria-controls={`panel-${tab}`}
              >
                {tab}
              </Tab>
            ))}
          </Tablist>
          {isLoading && 
            <Pane display="flex" alignItems="center" justifyContent="center" height={400}>
              <Spinner />
            </Pane>
          }
          {!isLoading && 
            <>
              <Pane display={TAB_RELAYSTATES === selectedTab ? 'block' : 'none'}>
                {relays.map(r =>
                  <Pane key={r.relay} display="flex" padding={16} background="tint2" borderRadius={3} marginY={16}>
                    <Pane flex={1} alignItems="center" display="flex">
                      <Heading size={600}>{r.name}</Heading>
                    </Pane>
                    <Pane>
                      <Switch height={24} checked={r.state === 1} onChange={e => this.toggleRelayState(r.relay)}/>
                    </Pane>
                  </Pane>
                )}
              </Pane>
              <Pane display={TAB_SCHEDULES === selectedTab ? 'block' : 'none'}>
                NYI
              </Pane>
              <Pane display={TAB_ACTIVITYLOG === selectedTab ? 'block' : 'none'} border="default" borderRadius={3}>
                <Table.Head>
                  <Table.TextHeaderCell flexGrow={2}>
                    Event
                  </Table.TextHeaderCell>
                  <Table.TextHeaderCell flexShrink={1}>
                    Occurred
                  </Table.TextHeaderCell>
                </Table.Head>
                <Table.VirtualBody height={475}>
                  {activity.map(e => (
                    <Table.Row key={e.stamp}>
                      <Table.TextCell flexGrow={2}>{e.msg}</Table.TextCell>
                      <Table.TextCell flexShrink={1}>
                        <Moment interval={0} format={this.props.isMobile ? "MM/DD/YY hh:mma" : "MMM DD, YYYY hh:mm:ssa"}>{e.stamp}</Moment>
                      </Table.TextCell>
                    </Table.Row>
                  ))}
                </Table.VirtualBody>
              </Pane>
            </>
          }
        </Pane>
    );
  }
}

const mapStateToProps = state => {
  return {  };
};

const mapSizesToProps = ({ width }) => ({
  isMobile: (width && width < 480),
});

export default connect(mapStateToProps)(sizes(mapSizesToProps)(App));
