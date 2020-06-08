import {
  toaster
} from 'evergreen-ui';


const alert = (status) => {
  if (status === 400) {
    toaster.warning("Bad Request", {
      id: 'bad-request',
      description: 'Your submission was either invalid or incomplete, please correct the form and try again.',
    });
  }
  if (status === 403) {
    toaster.danger('Access Denied', {
      id: 'access-denied',
      description: 'You are not authorized to access this resource.',
    });
  }
};

export default alert;
