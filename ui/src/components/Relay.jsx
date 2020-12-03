import React from 'react';
import PropTypes from 'prop-types';
import {
  BuildIcon,
  DisableIcon,
  IconButton,
  FloppyDiskIcon,
  Pane,
  Heading,
  Switch,
  TextInput,
} from 'evergreen-ui';

class Relay extends React.Component {
  static propTypes = {
    relay: PropTypes.shape({
      relay: PropTypes.number,
      name: PropTypes.string,
      state: PropTypes.number,
    }).isRequired,
    toggleState: PropTypes.func.isRequired,
    rename: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      editName: '',
    };
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.confirmEdit = this.confirmEdit.bind(this);
  }

  startEdit(editName) {
    this.setState({
      editing: true,
      editName,
    });
  }

  cancelEdit() {
    this.setState({
      editing: false,
    });
  }

  confirmEdit() {
    const { rename, relay } = this.props;
    const { editName } = this.state;
    rename(relay.relay, editName);
    this.setState({
      editing: false,
    });
  }

  render() {
    const { relay, toggleState } = this.props;
    const { editing, editName } = this.state;

    return (
      <Pane
        key={relay.relay}
        display="flex"
        padding={16}
        background="tint2"
        borderRadius={3}
        marginY={16}>
        <Pane flex={1} alignItems="center" display="flex">
          {!editing && (
            <>
              <Heading size={600}>{relay.name}</Heading>
              <IconButton
                appearance="minimal"
                marginLeft={6}
                height={24}
                icon={BuildIcon}
                onClick={(e) => this.startEdit(relay.name)}
              />
            </>
          )}
          {editing && (
            <>
              <TextInput
                height={40}
                onChange={(e) => this.setState({ editName: e.target.value })}
                value={editName}
              />
              <IconButton
                appearance="minimal"
                marginLeft={6}
                height={24}
                icon={FloppyDiskIcon}
                onClick={this.confirmEdit}
              />
              <IconButton
                appearance="minimal"
                intent="danger"
                marginLeft={6}
                height={24}
                icon={DisableIcon}
                onClick={this.cancelEdit}
              />
            </>
          )}
        </Pane>
        <Pane>
          <Switch
            height={24}
            checked={relay.state === 1}
            onChange={(e) => toggleState(relay.relay)}
          />
        </Pane>
      </Pane>
    );
  }
}

export default Relay;
