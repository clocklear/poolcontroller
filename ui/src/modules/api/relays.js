import axios from 'axios'

const getRelays = async () => {
  const res = await axios.get(
    `/relays`
  );
  return res.data.relayStates;
};

const toggleRelay = async (relay) => {
  const res = await axios.post(
    `/relays/${relay}/toggle`
  );
  return res.data.relayStates;
}

export default {
  getRelays,
  toggleRelay
}
