import React from 'react';
import { Pane, Spinner, Tab, TabNavigation } from 'evergreen-ui';
import { connect } from 'react-redux';
import api from 'modules/api';
import initialState from 'modules/initialState';
import { RelayList, ScheduledActions, ActivityLog, APIKeys } from 'components';
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
    this.renameRelay = this.renameRelay.bind(this);
    this.toggleRelayState = this.toggleRelayState.bind(this);
    this.editSchedule = this.editSchedule.bind(this);
    this.saveSchedule = this.saveSchedule.bind(this);
    this.removeSelectedSchedule = this.removeSelectedSchedule.bind(this);
    this.openRemoveScheduleDialog = this.openRemoveScheduleDialog.bind(this);
    this.closeRemoveScheduleDialog = this.closeRemoveScheduleDialog.bind(this);
    this.closeEditScheduleDialog = this.closeEditScheduleDialog.bind(this);
    this.newSchedule = this.newSchedule.bind(this);
    this.handleEditedScheduleChange =
      this.handleEditedScheduleChange.bind(this);
    this.refreshAPIKeys = this.refreshAPIKeys.bind(this);
    this.newAPIKey = this.newAPIKey.bind(this);
    this.closeNewAPIKeyDialog = this.closeNewAPIKeyDialog.bind(this);
    this.handleNewAPIKeyDescChange = this.handleNewAPIKeyDescChange.bind(this);
    this.createAPIKey = this.createAPIKey.bind(this);
    this.closeAPIKeyCreatedDialog = this.closeAPIKeyCreatedDialog.bind(this);
    this.openRemoveAPIKeyDialog = this.openRemoveAPIKeyDialog.bind(this);
    this.closeRemoveAPIKeyDialog = this.closeRemoveAPIKeyDialog.bind(this);
    this.removeSelectedAPIKey = this.removeSelectedAPIKey.bind(this);
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
    const schedules = await api.config.getSchedules();
    this.setState({ schedules: schedules });
  }

  async refreshAPIKeys() {
    const apiKeys = await api.config.getAPIKeys();
    this.setState({ apiKeys: apiKeys });
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
    this.refreshAPIKeys();
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

  async renameRelay(relay, name) {
    await api.relays.renameRelay(relay, name);
    this.refreshRelayState();
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

  closeNewAPIKeyDialog() {
    this.setState({ newAPIKeyDialogIsOpen: false });
  }

  async createAPIKey() {
    const newKey = await api.config.createAPIKey(this.state.newAPIKeyDesc);
    if (!newKey) {
      return;
    }
    await this.refreshAPIKeys();
    this.setState({
      apiKeyCreatedDialogIsOpen: true,
      newAPIKeyDialogIsOpen: false,
      createdAPIKey: newKey,
    });
  }

  closeAPIKeyCreatedDialog() {
    this.setState({ apiKeyCreatedDialogIsOpen: false, createdAPIKey: '' });
  }

  closeRemoveAPIKeyDialog() {
    this.setState({ removeAPIKeyDialogIsOpen: false });
  }

  async removeSelectedAPIKey() {
    await api.config.removeAPIKey(this.state.removeAPIKeyId);
    this.refreshAPIKeys();
    this.closeRemoveAPIKeyDialog();
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

  newAPIKey() {
    this.setState({
      newAPIKeyDialogIsOpen: true,
      newAPIKeyDesc: '',
    });
  }

  openRemoveScheduleDialog(sId) {
    this.setState({
      removeScheduleId: sId,
      removeScheduleDialogIsOpen: true,
    });
  }

  openRemoveAPIKeyDialog(kId) {
    this.setState({
      removeAPIKeyId: kId,
      removeAPIKeyDialogIsOpen: true,
    });
  }

  handleNewAPIKeyDescChange(newAPIKeyDesc) {
    this.setState({
      newAPIKeyDesc,
    });
  }

  render() {
    const {
      activity,
      apiKeyCreatedDialogIsOpen,
      apiKeys,
      createdAPIKey,
      editedSchedule,
      isLoading,
      newAPIKeyDesc,
      newAPIKeyDialogIsOpen,
      relays,
      removeScheduleDialogIsOpen,
      scheduleDialogIntent,
      scheduleDialogIsOpen,
      schedules,
      removeAPIKeyDialogIsOpen,
    } = this.state;

    const { pathname } = this.props.location;

    const tabs = [
      { name: 'Relay States', route: '/' },
      { name: 'Schedules', route: '/schedules' },
      { name: 'Activity Log', route: '/activity' },
      { name: 'API Keys', route: '/apikeys' },
    ];

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
                <RelayList
                  {...props}
                  relays={relays}
                  toggleRelayState={this.toggleRelayState}
                  renameRelay={this.renameRelay}
                />
              )}
            />
            <Route
              exact
              path="/schedules"
              render={(props) => (
                <ScheduledActions
                  {...props}
                  closeEditScheduleDialog={this.closeEditScheduleDialog}
                  closeRemoveScheduleDialog={this.closeRemoveScheduleDialog}
                  editedSchedule={editedSchedule}
                  editSchedule={this.editSchedule}
                  handleEditedScheduleChange={this.handleEditedScheduleChange}
                  newSchedule={this.newSchedule}
                  openRemoveScheduleDialog={this.openRemoveScheduleDialog}
                  relays={relays}
                  removeScheduleDialogIsOpen={removeScheduleDialogIsOpen}
                  removeSelectedSchedule={this.removeSelectedSchedule}
                  saveSchedule={this.saveSchedule}
                  scheduleDialogIntent={scheduleDialogIntent}
                  scheduleDialogIsOpen={scheduleDialogIsOpen}
                  schedules={schedules}
                />
              )}
            />
            <Route
              exact
              path="/activity"
              render={(props) => <ActivityLog {...props} activity={activity} />}
            />
            <Route
              exact
              path="/apikeys"
              render={(props) => (
                <APIKeys
                  {...props}
                  apiKeyCreatedDialogIsOpen={apiKeyCreatedDialogIsOpen}
                  apiKeys={apiKeys}
                  closeAPIKeyCreatedDialog={this.closeAPIKeyCreatedDialog}
                  closeNewAPIKeyDialog={this.closeNewAPIKeyDialog}
                  createAPIKey={this.createAPIKey}
                  createdAPIKey={createdAPIKey}
                  handleNewAPIKeyDescChange={this.handleNewAPIKeyDescChange}
                  newAPIKey={this.newAPIKey}
                  newAPIKeyDesc={newAPIKeyDesc}
                  newAPIKeyDialogIsOpen={newAPIKeyDialogIsOpen}
                  openRemoveAPIKeyDialog={this.openRemoveAPIKeyDialog}
                  removeAPIKeyDialogIsOpen={removeAPIKeyDialogIsOpen}
                  closeRemoveAPIKeyDialog={this.closeRemoveAPIKeyDialog}
                  removeSelectedAPIKey={this.removeSelectedAPIKey}
                />
              )}
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
