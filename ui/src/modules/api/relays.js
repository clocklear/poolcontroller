import axios from 'modules/xhr';
import config from 'modules/config';

const getRelays = async () => {
  const res = await axios.get(
    `${config.apiRoot}/relays`
  );
  return res.data.relayStates;
};

const toggleRelay = async (relay) => {
  const res = await axios.post(
    `${config.apiRoot}/relays/${relay}/toggle`
  );
  return res.data.relayStates;
}

export default {
  getRelays,
  toggleRelay
}
