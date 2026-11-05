import api from '../axios'

export const companyService = {
  create: (data) =>
    api.post('/companies', data).then((r) => r.data),

  getMyCompany: () =>
    api.get('/companies/me').then((r) => r.data),

  updateMyCompany: (data) =>
    api.put('/companies/me', data).then((r) => r.data),

  getMyContactDetails: () =>
    api.get('/companies/me/contact-details').then((r) => r.data),

  uploadVerificationDocument: (documentType, file) => {
    const formData = new FormData()
    formData.append('documentType', String(documentType))
    formData.append('file', file)
    return api
      .post('/companies/me/verification-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  getVerificationStatus: () =>
    api.get('/companies/me/verification').then((r) => r.data),

  deleteVerificationDocument: (documentId) =>
    api.delete(`/companies/me/verification-documents/${documentId}`).then((r) => r.data),

  submitForReview: () =>
    api.post('/companies/me/verification/submit').then((r) => r.data),

  getCompanyReviews: (companyId, params) =>
    api.get(`/companies/${companyId}/reviews`, { params }).then((r) => r.data),

  getMyCompanyReviews: (params) =>
    api.get('/companies/me/reviews', { params }).then((r) => r.data),
}

