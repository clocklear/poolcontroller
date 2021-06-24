import axios from 'modules/xhr';
import config from 'modules/config';

const getSchedules = async () => {
  const res = await axios.get(
    `${config.apiRoot}/config/schedules`
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

const getAPIKeys = async () => {
  const res = await axios.get(
    `${config.apiRoot}/config/keys`
  );
  return res.data;
}

const createAPIKey = async (desc) => {
  const res = await axios.post(
    `${config.apiRoot}/config/keys`, {
      desc
    }
  );
  if (!res || !res.status === 201 || !res.data) {
    return false
  }
  if (!res.data.key) {
    return false
  }
  return res.data.key;
}

const removeAPIKey = async (id) => {
  const res = await axios.delete(
    `${config.apiRoot}/config/keys/${id}`
  );
  if (!res || !res.status === 204) {
    return false
  }
  return true
}

const obj = {
  getSchedules,
  createSchedule,
  removeSchedule,
  setRelayName,
  getAPIKeys,
  createAPIKey,
  removeAPIKey,
}

export default obj