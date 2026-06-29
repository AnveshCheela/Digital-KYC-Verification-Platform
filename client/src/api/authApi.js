import client from './client';

export const register = async (fullName, email, password) => {
  const { data } = await client.post('/auth/register', { fullName, email, password });
  return data;
};

export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
};
