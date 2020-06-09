import axios from 'modules/xhr';
import config from 'modules/config';

const getEvents = async () => {
  try {
    const res = await axios.get(
      `${config.apiRoot}/events`
    );
    return res.data;
  } catch (error) {
    return [];
  }
};

export default {
  getEvents
}
