import axios from 'axios';
import authAxios from 'modules/xhr';
import config from 'modules/config';

const src = axios.CancelToken.source();

const auth0Exchange = async (code) => {
  const res = await axios.get(
    `/oauth/exchange?code=${code}`, {
      cancelToken: src.token
    }
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

const obj = {
  auth0Exchange,
  me,
};

export default obj;