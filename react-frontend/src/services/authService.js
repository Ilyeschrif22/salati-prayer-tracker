const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5220`;

async function readResponse(response, fallbackMessage) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  return readResponse(response, 'Invalid credentials');
};

export const getUser = async (userId) => {
  const response = await fetch(`${API_URL}/user/${encodeURIComponent(userId)}`);
  return readResponse(response, 'Unable to load user');
};

export const register = async ({ name, lastName, email, password }) => {
  const response = await fetch(`${API_URL}/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, lastName, email, password })
  });

  return readResponse(response, 'Unable to create your account');
};
