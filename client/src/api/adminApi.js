import client from './client';

export const getQueue = async (params = {}) => {
  const { data } = await client.get('/admin/queue', { params });
  return data;
};

export const reviewVerification = async (id, action, notes) => {
  const { data } = await client.post(`/admin/review/${id}`, { action, notes });
  return data;
};

export const getAuditLogs = async (params = {}) => {
  const { data } = await client.get('/admin/audit-logs', { params });
  return data;
};

export const getStats = async () => {
  const { data } = await client.get('/admin/stats');
  return data;
};
