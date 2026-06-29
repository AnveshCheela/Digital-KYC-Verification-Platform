import client from './client';

export const uploadDocument = async (file, documentType) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);
  const { data } = await client.post('/kyc/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getVerificationStatus = async (id) => {
  const { data } = await client.get(`/kyc/status/${id}`);
  return data;
};

export const getMyVerifications = async () => {
  const { data } = await client.get('/kyc/my-verifications');
  return data;
};
