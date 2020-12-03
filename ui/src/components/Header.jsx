import React from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
  LogOutIcon,
  Pane,
  Popover,
  Menu,
  Heading,
  Button,
  Position,
} from 'evergreen-ui';

class Header extends React.Component {
  static propTypes = {
    user: PropTypes.shape({
      accessToken: PropTypes.string,
      workspace: PropTypes.string,
      picture: PropTypes.string,
    }).isRequired,
    onLogout: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
  };

  render() {
    const { isAuthenticated, user, onLogout } = this.props;

    return (
      <Pane display="flex">
        {isAuthenticated && (
          <>
            <Pane flex={1} alignItems="center" display="flex">
              {!this.props.isMobile && (
                <Heading paddingY={16} size={700}>
                  Pool Controller
                </Heading>
              )}
            </Pane>
            <Pane display="flex" justifyContent="center" alignItems="center">
              <Popover
                position={Position.BOTTOM_RIGHT}
                content={
                  <Menu>
                    <Menu.Group>
                      <Menu.Item icon={LogOutIcon} onSelect={onLogout}>
                        Logout
                      </Menu.Item>
                    </Menu.Group>
                  </Menu>
                }>
                <Button
                  appearance="minimal"
                  height={50}
                  paddingLeft={5}
                  paddingRight={5}>
                  <Avatar src={user.picture} name={user.name} size={40} />
                </Button>
              </Popover>
            </Pane>
          </>
        )}
      </Pane>
    );
  }
}

export default Header;
