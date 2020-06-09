import axios from 'modules/xhr';
import config from 'modules/config';

const getConfig = async () => {
  const res = await axios.get(
    `${config.apiRoot}/config`
  );
  return res.data;
};

const createSchedule = async (schedule) => {
  const res = await axios.post(
    `${config.apiRoot}/config/schedules`, schedule
  );
  return res.data;
}

const removeSchedule = async (scheduleId) => {
  const res = await axios.delete(
    `${config.apiRoot}/config/schedules/${scheduleId}`
  );
  return res.status === 204
}

const setRelayName = async (relay, relayName) => {
  const res = await axios.post(
    `${config.apiRoot}/config/relay/${relay}/name`, {
      relayName
    }
  );
  return res.status === 204
}

export default {
  getConfig,
  createSchedule,
  removeSchedule,
  setRelayName
}
