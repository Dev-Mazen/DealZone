import api from '../utils/api';

/** POST /companies */
export const createCompany = (data) =>
  api.post('/companies', data).then((r) => r.data);

/** GET /companies/me */
export const getMyCompany = () =>
  api.get('/companies/me').then((r) => r.data);

/** PUT /companies/me */
export const updateMyCompany = (data) =>
  api.put('/companies/me', data).then((r) => r.data);

/** GET /companies/me/contact-details */
export const getMyContactDetails = () =>
  api.get('/companies/me/contact-details').then((r) => r.data);

/** GET /companies/me/verification */
export const getVerificationStatus = () =>
  api.get('/companies/me/verification').then((r) => r.data);

/**
 * POST /companies/me/verification-documents
 * @param {File} file
 * @param {number} documentType 1=CommercialRegister, 2=TaxCard, 3=IndustrialRegister, 4=QualityCertificate, 5=Other
 */
export const uploadVerificationDocument = (file, documentType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  return api
    .post('/companies/me/verification-documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

/** DELETE /companies/me/verification-documents/:documentId */
export const deleteVerificationDocument = (documentId) =>
  api.delete(`/companies/me/verification-documents/${documentId}`);

/** POST /companies/me/verification/submit */
export const submitForVerification = () =>
  api.post('/companies/me/verification/submit').then((r) => r.data);

/** GET /companies/:companyId/reviews */
export const getCompanyReviews = (companyId, params) =>
  api.get(`/companies/${companyId}/reviews`, { params }).then((r) => r.data);

/** GET /companies/me/reviews */
export const getMyCompanyReviews = (params) =>
  api.get('/companies/me/reviews', { params }).then((r) => r.data);

