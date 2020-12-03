import axios from 'modules/xhr';
import config from 'modules/config';

const getRelays = async () => {
  try {
    const res = await axios.get(
      `${config.apiRoot}/relays`
    );
    return res.data.relayStates;
  } catch (error) {
    return [];
  }
};

const toggleRelay = async (relay) => {
  try {
    const res = await axios.post(
      `${config.apiRoot}/relays/${relay}/toggle`
    );
    return res.data.relayStates;
  } catch (error) {
    return [];
  }
}

const renameRelay = async (relay, relayName) => {
  try {
    await axios.post(
      `${config.apiRoot}/config/relay/${relay}/name`,
      {
        relayName
      }
    );
    return
  } catch (error) {
    return [];
  }
}

const obj = {
  getRelays,
  renameRelay,
  toggleRelay,
};

export default obj;
