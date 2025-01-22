import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  cloud: {
    // Project: Default project
    projectID: 3741314,
    // Test runs with the same name groups test runs together.
    name: 'Test 1.'
  }
};

export default function() {
  http.post('http://localhost:8000/paws-care/v1/users/register');
  sleep(1);
}