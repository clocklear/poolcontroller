import React from 'react';
import PropTypes from 'prop-types';
import { Pane, Heading, Table } from 'evergreen-ui';
import Moment from 'react-moment';
import sizes from 'react-sizes';

class ActivityLog extends React.Component {
  static propTypes = {
    activity: PropTypes.arrayOf(
      PropTypes.shape({
        stamp: PropTypes.string,
        msg: PropTypes.string,
      })
    ).isRequired,
  };

  render() {
    const { activity } = this.props;
    return (
      <>
        {activity.length > 0 && (
          <>
            <Table.Head>
              <Table.TextHeaderCell flexGrow={2}>Event</Table.TextHeaderCell>
              <Table.TextHeaderCell flexShrink={1}>
                Occurred
              </Table.TextHeaderCell>
            </Table.Head>
            <Table.VirtualBody height={475}>
              {activity.map(e => (
                <Table.Row key={e.stamp}>
                  <Table.TextCell flexGrow={2}>{e.msg}</Table.TextCell>
                  <Table.TextCell flexShrink={1}>
                    <Moment
                      interval={0}
                      format={
                        this.props.isMobile
                          ? 'MM/DD/YY hh:mma'
                          : 'MMM DD, YYYY hh:mm:ssa'
                      }>
                      {e.stamp}
                    </Moment>
                  </Table.TextCell>
                </Table.Row>
              ))}
            </Table.VirtualBody>
          </>
        )}
        {activity.length === 0 && (
          <Pane
            flex={1}
            alignItems="center"
            display="flex"
            padding={16}
            border="default"
            borderRadius={3}>
            <Heading size={200}>No activity exists.</Heading>
          </Pane>
        )}
      </>
    );
  }
}

const mapSizesToProps = ({ width }) => ({
  isMobile: width && width < 480,
});

export default sizes(mapSizesToProps)(ActivityLog);
