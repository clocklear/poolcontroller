import React from 'react';
import PropTypes from 'prop-types';
import {
  Pane,
  Heading,
  IconButton,
  Dialog,
  FormField,
  Combobox,
  TextInput,
  Button,
} from 'evergreen-ui';
import cronstrue from 'cronstrue';

class ScheduledActions extends React.Component {
  static propTypes = {
    schedules: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        relay: PropTypes.number.isRequired,
        expression: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
      })
    ).isRequired,
    relays: PropTypes.arrayOf(
      PropTypes.shape({
        relay: PropTypes.number,
        name: PropTypes.string,
        state: PropTypes.number,
      })
    ).isRequired,
    editSchedule: PropTypes.func.isRequired,
    openRemoveDialog: PropTypes.func.isRequired,
    removeScheduleDialogIsOpen: PropTypes.bool.isRequired,
    removeSelectedSchedule: PropTypes.func.isRequired,
    scheduleDialogIsOpen: PropTypes.bool.isRequired,
    closeRemoveScheduleDialog: PropTypes.func.isRequired,
    scheduleDialogIntent: PropTypes.string.isRequired,
    editedSchedule: PropTypes.shape({
      id: PropTypes.string,
      relay: PropTypes.number,
      expression: PropTypes.string,
      action: PropTypes.string,
    }),
    closeEditScheduleDialog: PropTypes.func.isRequired,
    newSchedule: PropTypes.func.isRequired,
    saveSchedule: PropTypes.func.isRequired,
  };

  render() {
    const {
      schedules,
      editSchedule,
      openRemoveDialog,
      removeScheduleDialogIsOpen,
      removeSelectedSchedule,
      scheduleDialogIsOpen,
      closeRemoveScheduleDialog,
      scheduleDialogIntent,
      editedSchedule,
      relays,
      closeEditScheduleDialog,
      newSchedule,
      saveSchedule,
    } = this.props;

    const getReadableCronString = expr => {
      try {
        return cronstrue.toString(expr);
      } catch {
        return expr;
      }
    };

    const findRelayById = (relays, id) => {
      return relays.reduce((accum, curr) => {
        if (accum) return accum;
        if (curr.relay === id) return curr;
        return undefined;
      }, undefined);
    };

    const getRelayName = (relays, id) => {
      const rly = findRelayById(relays, id);
      if (!rly) return 'Relay ' + id;
      return rly.name;
    };

    const findActionByString = (actions, str) => {
      return actions.reduce((accum, curr) => {
        if (accum) return accum;
        if (curr.value === str) return curr;
        return undefined;
      }, undefined);
    };

    const actions = [
      {
        label: 'Turn Off',
        value: 'off',
      },
      {
        label: 'Turn On',
        value: 'on',
      },
    ];

    return (
      <>
        {schedules.length > 0 &&
          schedules.map(s => (
            <Pane
              key={s.id}
              display="flex"
              padding={16}
              background="tint2"
              borderRadius={3}
              marginY={16}>
              <Pane flex={1} alignItems="center" display="flex">
                <Pane flex={1} display="flex" flexDirection="column">
                  <Heading size={500}>
                    {getReadableCronString(s.expression)}
                  </Heading>
                  <Heading size={100}>
                    Turn {s.action} {getRelayName(relays, s.relay)}
                  </Heading>
                </Pane>
                <Pane display="flex" flexDirection="row">
                  <IconButton
                    icon="edit"
                    appearance="minimal"
                    onClick={() => editSchedule(s)}
                  />
                  <IconButton
                    icon="trash"
                    intent="danger"
                    appearance="minimal"
                    onClick={() => openRemoveDialog(s.id)}
                  />
                </Pane>
              </Pane>
            </Pane>
          ))}
        {schedules.length === 0 && (
          <Pane
            flex={1}
            alignItems="center"
            display="flex"
            padding={16}
            border="default"
            borderRadius={3}>
            <Heading size={200}>
              No scheduled actions have been defined.
            </Heading>
          </Pane>
        )}
        <Pane display="flex" marginY={16}>
          <Button
            marginRight={12}
            iconBefore="add-to-artifact"
            onClick={e => newSchedule()}>
            New scheduled action
          </Button>
        </Pane>
        <Dialog
          intent="danger"
          isShown={removeScheduleDialogIsOpen}
          title="Remove scheduled action?"
          onCloseComplete={() => closeRemoveScheduleDialog()}
          onCancelComplete={() => closeRemoveScheduleDialog()}
          onConfirm={() => removeSelectedSchedule()}
          confirmLabel="Remove">
          Are you sure you want to remove this scheduled action?
        </Dialog>
        <Dialog
          isShown={scheduleDialogIsOpen}
          title={scheduleDialogIntent + ' scheduled action'}
          onCloseComplete={() => closeEditScheduleDialog()}
          onCancelComplete={() => closeEditScheduleDialog()}
          onConfirm={() => saveSchedule()}
          confirmLabel="Save">
          <Pane display="flex" flexDirection="column">
            <FormField
              label="Cron Expression"
              hint="Any statement supported by github.com/robfig/cron is valid.">
              <TextInput
                width="100%"
                placeholder="0 0 * * *"
                value={editedSchedule.expression}
              />
            </FormField>
            <FormField label="Relay" marginTop={10}>
              <Combobox
                items={relays}
                itemToString={i => (i ? i.name : '')}
                selectedItem={findRelayById(relays, editedSchedule.relay)}
                width="100%"
              />
            </FormField>
            <FormField label="Action" marginTop={10}>
              <Combobox
                items={actions}
                itemToString={i => (i ? i.label : '')}
                selectedItem={findActionByString(
                  actions,
                  editedSchedule.action
                )}
                width="100%"
              />
            </FormField>
          </Pane>
        </Dialog>
      </>
    );
  }
}

export default ScheduledActions;
