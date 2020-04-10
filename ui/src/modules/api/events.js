import axios from 'modules/xhr';
import config from 'modules/config';

const getEvents = async () => {
  const res = await axios.get(
    `${config.apiRoot}/events`
  );
  return res.data;
};

export default {
  getEvents
}
