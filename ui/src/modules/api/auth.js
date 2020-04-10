import axios from 'axios';

const auth0Exchange = async (code) => {
  const res = await axios.get(
    `/oauth/exchange?code=${code}`
  );
  return res.data;
};

export default {
  auth0Exchange
};
