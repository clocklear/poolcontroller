import React from 'react'
import { Pane, Spinner, Switch, Heading, Tablist, Tab, Table, Strong, IconButton, Dialog, FormField, TextInput, Combobox, Button } from 'evergreen-ui'
import { connect } from 'react-redux';
import Moment from 'react-moment';
import api from '../modules/api';
import sizes from 'react-sizes';
import cronstrue from 'cronstrue';
import initialState from '../modules/initialState'

class App extends React.Component {
  static propTypes = {
    
  };

  constructor(props) {
    super(props);
    this.state = initialState;
    this.refreshRelayState = this.refreshRelayState.bind(this)
    this.toggleRelayState = this.toggleRelayState.bind(this)
    this.editSchedule = this.editSchedule.bind(this)
    this.saveSchedule = this.saveSchedule.bind(this)
    this.findRelayById = this.findRelayById.bind(this)
    this.findActionByString = this.findActionByString.bind(this)
    this.removeSchedule = this.removeSchedule.bind(this)
  }

  async refreshRelayState() {
    const relays = await api.relays.getRelays();
    this.setState({ relays });
  }

  async refreshActivity() {
    const activity = await api.events.getEvents();
    this.setState({ activity });
  }

  async refreshSchedules() {
    const cfg = await api.config.getConfig();
    this.setState({ schedules: cfg.schedules });
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

  editSchedule(s) {
    const editedSchedule = { ...s };
    this.setState({
      scheduleDialogIntent: 'Edit',
      scheduleDialogIsOpen: true,
      editedSchedule
    });
  }

  async removeSchedule(sId) {
    await api.config.removeSchedule(sId)
    this.refreshSchedules()
  }

  async saveSchedule() {
    await api.config.createSchedule(this.state.editedSchedule);
    await this.refreshSchedules();
    this.setState({ scheduleDialogIsOpen: false })
  }

  findRelayById(relays, id) {
    return relays.reduce((accum, curr) => {
      if (accum) return accum
      if (curr.relay === id) return curr;
      return undefined;
    }, undefined);
  }

  findActionByString(actions, str) {
    return actions.reduce((accum, curr) => {
      if (accum) return accum
      if (curr.value === str) return curr
      return undefined;
    }, undefined);
  }

  newSchedule() {
    const editedSchedule = {
      relay: 0,
      expression: "",
      action: "off"
    };
    this.setState({
      scheduleDialogIntent: 'New',
      scheduleDialogIsOpen: true,
      editedSchedule
    });
  }

  render() {
    const { relays, isLoading, selectedTab, tabs, activity, schedules, scheduleDialogIsOpen, scheduleDialogIntent, editedSchedule, removeScheduleDialogIsOpen, removeScheduleId } = this.state
    const TAB_RELAYSTATES = tabs[0]
    const TAB_SCHEDULES = tabs[1]
    const TAB_ACTIVITYLOG = tabs[2]
    const actions = [
      {
        "label": "Off",
        "value": "off"
      },
      {
        "label": "On",
        "value": "on"
      }
    ]

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
                {schedules.length > 0 && schedules.map(s =>
                  <Pane key={s.id} display="flex" padding={16} background="tint2" borderRadius={3} marginY={16}>
                    <Pane flex={1} alignItems="center" display="flex">
                      <Pane flex={1} display="flex" flexDirection="column">
                        <Heading size={500}>{cronstrue.toString(s.expression)}</Heading>
                        <Heading size={100}>
                          Turn <Strong>{s.action}</Strong> relay <Strong>{s.relay}</Strong>
                        </Heading>
                      </Pane>
                      <Pane display="flex" flexDirection="row">
                        <IconButton icon="edit" appearance="minimal" onClick={e => this.editSchedule(s)} />
                        <IconButton icon="trash" intent="danger" appearance="minimal" onClick={e => this.setState({removeScheduleId: s.id, removeScheduleDialogIsOpen: true})} />
                      </Pane>
                    </Pane>
                  </Pane>
                )}
                {schedules.length === 0 && 
                  <Pane flex={1} alignItems="center" display="flex" padding={16} border="default" borderRadius={3}>
                    <Heading size={200}>No scheduled actions have been defined.</Heading>
                  </Pane>
                }
                <Pane display="flex" marginY={16}>
                  <Button marginRight={12} iconBefore="add-to-artifact" onClick={e => this.newSchedule()}>New scheduled action</Button>
                </Pane>
                <Dialog 
                  intent="danger"
                  isShown={removeScheduleDialogIsOpen}
                  title="Remove scheduled action?"
                  onCloseComplete={() => this.setState({ removeScheduleDialogIsOpen: false })}
                  onCancelComplete={() => this.setState({ removeScheduleDialogIsOpen: false })}
                  onConfirm={() => this.removeSchedule(removeScheduleId)}
                  confirmLabel="Remove">
                    Are you sure you want to remove this scheduled action?
                </Dialog>
                <Dialog 
                  isShown={scheduleDialogIsOpen}
                  title={scheduleDialogIntent + ' scheduled action'}
                  onCloseComplete={() => this.setState({ scheduleDialogIsOpen: false })}
                  onCancelComplete={() => this.setState({ scheduleDialogIsOpen: false })}
                  onConfirm={() => this.saveSchedule()}
                  confirmLabel="Save">
                  <Pane display="flex" flexDirection="column">
                    <FormField label="Cron Expression" hint="Any statement supported by github.com/robfig/cron is valid.">
                      <TextInput width="100%" placeholder="0 0 * * *" value={editedSchedule.expression} />
                    </FormField>
                    <FormField label="Relay" marginTop={10}>
                      <Combobox
                        items={relays}
                        itemToString={i => i ? i.name : ''}
                        selectedItem={this.findRelayById(relays, editedSchedule.relay)}
                        width="100%"
                        />
                    </FormField>
                    <FormField label="Action" marginTop={10}>
                      <Combobox
                        items={actions}
                        itemToString={i => i ? i.label : ''}
                        selectedItem={this.findActionByString(actions, editedSchedule.action)}
                        width="100%"
                        />
                    </FormField>
                  </Pane>
                </Dialog>
              </Pane>
              <Pane display={TAB_ACTIVITYLOG === selectedTab ? 'block' : 'none'} border="default" borderRadius={3}>
                {activity.length > 0 && 
                  <>
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
                  </>
                }
                {activity.length === 0 &&
                  <Pane flex={1} alignItems="center" display="flex" padding={16} border="default" borderRadius={3}>
                    <Heading size={200}>No activity exists.</Heading>
                  </Pane>
                }
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
