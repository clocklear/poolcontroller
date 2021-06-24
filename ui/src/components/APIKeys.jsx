import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  FormField,
  Heading,
  IconButton,
  Pane,
  Table,
  TextInput,
  TrashIcon,
} from 'evergreen-ui';

class APIKeys extends React.Component {
  static propTypes = {
    apiKeyCreatedDialogIsOpen: PropTypes.bool.isRequired,
    apiKeys: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        desc: PropTypes.string,
      })
    ).isRequired,
    newAPIKey: PropTypes.func.isRequired,
    newAPIKeyDesc: PropTypes.string.isRequired,
    newAPIKeyDialogIsOpen: PropTypes.bool.isRequired,
    closeAPIKeyCreatedDialog: PropTypes.func.isRequired,
    closeNewAPIKeyDialog: PropTypes.func.isRequired,
    createAPIKey: PropTypes.func.isRequired,
    createdAPIKey: PropTypes.string.isRequired,
    openRemoveAPIKeyDialog: PropTypes.func.isRequired,
    removeAPIKeyDialogIsOpen: PropTypes.bool.isRequired,
    closeRemoveAPIKeyDialog: PropTypes.func.isRequired,
    removeSelectedAPIKey: PropTypes.func.isRequired,
  };

  render() {
    const {
      apiKeyCreatedDialogIsOpen,
      apiKeys,
      createdAPIKey,
      createAPIKey,
      newAPIKey,
      newAPIKeyDialogIsOpen,
      newAPIKeyDesc,
      closeAPIKeyCreatedDialog,
      closeNewAPIKeyDialog,
      handleNewAPIKeyDescChange,
      openRemoveAPIKeyDialog,
      removeAPIKeyDialogIsOpen,
      closeRemoveAPIKeyDialog,
      removeSelectedAPIKey,
    } = this.props;

    return (
      <>
        <Pane border="default" borderRadius={3}>
          {apiKeys.length > 0 && (
            <>
              <Table.Head>
                <Table.TextHeaderCell flexGrow={2}>Key</Table.TextHeaderCell>
                <Table.TextHeaderCell flexShrink={1}>
                  Action
                </Table.TextHeaderCell>
              </Table.Head>
              <Table.VirtualBody height={475}>
                {apiKeys.map((k) => (
                  <Table.Row key={k.id}>
                    <Table.TextCell flexGrow={2}>{k.desc}</Table.TextCell>
                    <Table.TextCell flexShrink={1}>
                      <IconButton
                        icon={TrashIcon}
                        intent="danger"
                        appearance="minimal"
                        onClick={() => openRemoveAPIKeyDialog(k.id)}
                      />
                    </Table.TextCell>
                  </Table.Row>
                ))}
              </Table.VirtualBody>
            </>
          )}
          {apiKeys.length === 0 && (
            <Pane
              flex={1}
              alignItems="center"
              display="flex"
              padding={16}
              border="none"
              borderRadius={3}>
              <Heading size={200}>You don't have any API keys.</Heading>
            </Pane>
          )}
        </Pane>
        <Pane display="flex" marginY={16}>
          <Button
            marginRight={12}
            iconBefore="add-to-artifact"
            onClick={() => newAPIKey()}>
            Create API Key
          </Button>
        </Pane>
        <Dialog
          isShown={newAPIKeyDialogIsOpen}
          title="Create API Key"
          onCloseComplete={() => closeNewAPIKeyDialog()}
          onCancelComplete={() => closeNewAPIKeyDialog()}
          onConfirm={() => createAPIKey()}
          confirmLabel="Create">
          <Pane display="flex" flexDirection="column">
            <FormField
              label="Description"
              hint="A description for your API key.  Once set, it cannot be changed.">
              <TextInput
                width="100%"
                value={newAPIKeyDesc}
                onChange={(e) => handleNewAPIKeyDescChange(e.target.value)}
              />
            </FormField>
          </Pane>
        </Dialog>
        <Dialog
          isShown={apiKeyCreatedDialogIsOpen}
          title="API Key Created"
          onCloseComplete={() => closeAPIKeyCreatedDialog()}
          onConfirm={() => closeAPIKeyCreatedDialog()}
          hasCancel={false}
          confirmLabel="OK">
          <Pane display="flex" flexDirection="column">
            <FormField
              label="API Key"
              hint="This is your new API key.  You should save it in a safe place, as it will not be displayed again..">
              <TextInput width="100%" value={createdAPIKey} readOnly={true} />
            </FormField>
          </Pane>
        </Dialog>
        <Dialog
          intent="danger"
          isShown={removeAPIKeyDialogIsOpen}
          title="Remove API Key?"
          onCloseComplete={() => closeRemoveAPIKeyDialog()}
          onCancelComplete={() => closeRemoveAPIKeyDialog()}
          onConfirm={() => removeSelectedAPIKey()}
          confirmLabel="Remove">
          Are you sure you want to remove this API key?
        </Dialog>
      </>
    );
  }
}

export default APIKeys;
