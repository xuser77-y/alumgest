import axios from 'axios';

let activeRequests = 0;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// REQUEST
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  activeRequests++;
  document.body.classList.add('loading');

  return config;
});

// RESPONSE
api.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0) {
      document.body.classList.remove('loading');
    }
    return response;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      document.body.classList.remove('loading');
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
