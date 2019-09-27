import axios from 'axios'

const getEvents = async () => {
  const res = await axios.get(
    `/events`
  );
  return res.data;
};

export default {
  getEvents
}
