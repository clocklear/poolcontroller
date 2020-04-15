import axios from 'axios';
import authAxios from 'modules/xhr';
import config from 'modules/config';

const auth0Exchange = async (code) => {
  const res = await axios.get(
    `/oauth/exchange?code=${code}`
  ).catch(() => {
    return Promise.resolve({
      data: {
        accessToken: '',
        profile: {}
      }
    });
  });
  return res.data;
};

const me = async () => {
  const res = await authAxios.get(`${config.apiRoot}/me`).catch(() => {
    return Promise.resolve({
      data: {
        permissions: []
      }
    })
  });
  return res.data;
}

export default {
  auth0Exchange,
  me,
};
