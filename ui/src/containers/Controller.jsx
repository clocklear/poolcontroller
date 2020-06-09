import React from 'react';
import { Pane, Spinner, Tab, TabNavigation } from 'evergreen-ui';
import { connect } from 'react-redux';
import api from 'modules/api';
import initialState from 'modules/initialState';
import { RelayStates, ScheduledActions, ActivityLog } from 'components';
import { Route, Link, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
// import logo from 'assets/logo.svg';

class Controller extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = initialState;
    this.refreshRelayState = this.refreshRelayState.bind(this);
    this.toggleRelayState = this.toggleRelayState.bind(this);
    this.editSchedule = this.editSchedule.bind(this);
    this.saveSchedule = this.saveSchedule.bind(this);
    this.removeSelectedSchedule = this.removeSelectedSchedule.bind(this);
    this.openRemoveDialog = this.openRemoveDialog.bind(this);
    this.closeRemoveScheduleDialog = this.closeRemoveScheduleDialog.bind(this);
    this.closeEditScheduleDialog = this.closeEditScheduleDialog.bind(this);
    this.newSchedule = this.newSchedule.bind(this);
    this.handleEditedScheduleChange = this.handleEditedScheduleChange.bind(
      this
    );
  }

  abortController = new AbortController();

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
    this.refreshRelayState();
    this.relayRefreshInterval = setInterval(() => {
      this.refreshRelayState();
    }, 5000);
    this.refreshActivity();
    this.activityRefreshInterval = setInterval(() => {
      this.refreshActivity();
    }, 5000);
    this.setState({ isLoading: false });
    this.refreshSchedules();
  }
  componentWillUnmount() {
    this.abortController.abort();
    clearInterval(this.relayRefreshInterval);
    clearInterval(this.activityRefreshInterval);
  }

  async toggleRelayState(relay) {
    const relays = await api.relays.toggleRelay(relay);
    this.setState({ relays });
  }

  editSchedule(s) {
    const editedSchedule = { ...s };
    this.setState({
      scheduleDialogIntent: 'Edit',
      scheduleDialogIsOpen: true,
      editedSchedule,
    });
  }

  handleEditedScheduleChange(prop, val) {
    const s = this.state.editedSchedule;
    this.setState({
      editedSchedule: {
        ...s,
        [prop]: val,
      },
    });
  }

  closeRemoveScheduleDialog() {
    this.setState({ removeScheduleDialogIsOpen: false });
  }

  closeEditScheduleDialog() {
    this.setState({ scheduleDialogIsOpen: false });
  }

  async removeSelectedSchedule() {
    await api.config.removeSchedule(this.state.removeScheduleId);
    this.refreshSchedules();
    this.closeRemoveScheduleDialog();
  }

  async saveSchedule() {
    await api.config.createSchedule(this.state.editedSchedule);
    await this.refreshSchedules();
    this.setState({ scheduleDialogIsOpen: false });
  }

  newSchedule() {
    const editedSchedule = {
      relay: 0,
      expression: '',
      action: 'off',
    };
    this.setState({
      scheduleDialogIntent: 'New',
      scheduleDialogIsOpen: true,
      editedSchedule,
    });
  }

  openRemoveDialog(sId) {
    this.setState({
      removeScheduleId: sId,
      removeScheduleDialogIsOpen: true,
    });
  }

  render() {
    const {
      relays,
      isLoading,
      activity,
      schedules,
      scheduleDialogIsOpen,
      scheduleDialogIntent,
      editedSchedule,
      removeScheduleDialogIsOpen,
    } = this.state;

    const { pathname } = this.props.location;

    const tabs = [
      { name: 'Relay States', route: '/' },
      { name: 'Schedules', route: '/schedules' },
      { name: 'Activity Log', route: '/activity' },
    ];

    // Was attempting to put the logo in the background subtlely, but
    // need to tweak the opacity/alpha...
    // const containerStyle = {
    //   backgroundImage: `url(${logo})`,
    //   backgroundRepeat: "no-repeat",
    //   backgroundPositionY: "bottom",
    //   backgroundPositionX: "right",
    //   backgroundSize: 384,
    // };

    return (
      <Pane>
        <TabNavigation marginY={16} flexBasis={240} marginRight={24}>
          {tabs.map((tab, index) => (
            <Tab
              key={tab.name}
              id={tab.name}
              is={Link}
              to={tab.route}
              isSelected={pathname === tab.route}
              aria-controls={`panel-${tab.name}`}>
              {tab.name}
            </Tab>
          ))}
        </TabNavigation>
        {isLoading && (
          <Pane
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={400}>
            <Spinner />
          </Pane>
        )}
        {!isLoading && (
          <Switch>
            <Route
              exact
              path="/"
              render={(props) => (
                <RelayStates
                  {...props}
                  relays={relays}
                  toggleRelayState={this.toggleRelayState}
                />
              )}
            />
            <Route
              exact
              path="/schedules"
              render={(props) => (
                <ScheduledActions
                  {...props}
                  schedules={schedules}
                  editSchedule={this.editSchedule}
                  openRemoveDialog={this.openRemoveDialog}
                  removeScheduleDialogIsOpen={removeScheduleDialogIsOpen}
                  removeSelectedSchedule={this.removeSelectedSchedule}
                  scheduleDialogIsOpen={scheduleDialogIsOpen}
                  closeRemoveScheduleDialog={this.closeRemoveScheduleDialog}
                  scheduleDialogIntent={scheduleDialogIntent}
                  editedSchedule={editedSchedule}
                  relays={relays}
                  closeEditScheduleDialog={this.closeEditScheduleDialog}
                  newSchedule={this.newSchedule}
                  saveSchedule={this.saveSchedule}
                  handleEditedScheduleChange={this.handleEditedScheduleChange}
                />
              )}
            />
            <Route
              exact
              path="/activity"
              render={(props) => <ActivityLog {...props} activity={activity} />}
            />
          </Switch>
        )}
      </Pane>
    );
  }
}

const mapStateToProps = () => {
  return {};
};

export default connect(mapStateToProps)(withRouter(Controller));
