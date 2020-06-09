import {
  createBrowserHistory
} from 'history';
import qs from 'qs';

const history = createBrowserHistory();

history.location = {
  ...history.location,
  query: qs.parse(history.location.search.substr(1)),
  state: {},
};

history.listen(() => {
  history.location = {
    ...history.location,
    query: qs.parse(history.location.search.substr(1)),
    state: history.location.state || {},
  };
});

export default history;
