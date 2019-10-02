import axios from 'axios'

const getConfig = async () => {
  const res = await axios.get(
    `/config`
  );
  return res.data;
};

const createSchedule = async (schedule) => {
  const res = await axios.post(
    `/config/schedules`, schedule
  );
  return res.data;
}

const removeSchedule = async (scheduleId) => {
  const res = await axios.delete(
    `/config/schedules/${scheduleId}`
  );
  return res.status === 204
}

const setRelayName = async (relay, relayName) => {
  const res = await axios.post(
    `/config/relay/${relay}/name`, {
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
