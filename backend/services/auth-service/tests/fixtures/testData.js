import { faker } from '@faker-js/faker';

export const validUserData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'Password123',
  phone: '+1234567890',
  role: 'user'
};

export const adminUserData = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'AdminPassword123',
  phone: '+1234567891',
  role: 'admin'
};

export const moderatorUserData = {
  firstName: 'Moderator',
  lastName: 'User',
  email: 'moderator@example.com',
  password: 'ModeratorPassword123',
  phone: '+1234567892',
  role: 'moderator'
};

export const invalidUserData = {
  firstName: 'J', // Too short
  lastName: 'D', // Too short
  email: 'invalid-email', // Invalid email
  password: '123', // Too short
  phone: 'invalid-phone' // Invalid phone
};

export const generateRandomUser = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  password: 'Password123',
  phone: faker.phone.number(),
  role: 'user'
});

export const generateMultipleUsers = (count = 10) => {
  return Array.from({ length: count }, () => generateRandomUser());
};

export const loginCredentials = {
  valid: {
    email: 'john.doe@example.com',
    password: 'Password123'
  },
  invalid: {
    email: 'john.doe@example.com',
    password: 'WrongPassword'
  },
  nonExistent: {
    email: 'nonexistent@example.com',
    password: 'Password123'
  }
};

export const passwordResetData = {
  validEmail: 'john.doe@example.com',
  invalidEmail: 'nonexistent@example.com'
};

export const profileUpdateData = {
  valid: {
    firstName: 'Updated',
    lastName: 'Name',
    phone: '+9876543210'
  },
  invalid: {
    firstName: 'A', // Too short
    lastName: 'B', // Too short
    phone: 'invalid' // Invalid phone
  }
};

export const changePasswordData = {
  valid: {
    currentPassword: 'Password123',
    newPassword: 'NewPassword123'
  },
  invalid: {
    currentPassword: 'WrongPassword',
    newPassword: 'NewPassword123'
  },
  samePassword: {
    currentPassword: 'Password123',
    newPassword: 'Password123'
  }
};

export const testTokens = {
  validAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZjEyMzQ1Njc4OWFiY2RlZiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzA0NjQ4MDAwLCJleHAiOjE3MDUyNTI4MDB9.test-signature',
  invalidToken: 'invalid.token.here',
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZjEyMzQ1Njc4OWFiY2RlZiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.expired-signature'
};

export const apiEndpoints = {
  register: '/api/v1/auth/register',
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  refreshToken: '/api/v1/auth/refresh-token',
  profile: '/api/v1/auth/profile',
  changePassword: '/api/v1/auth/change-password',
  forgotPassword: '/api/v1/auth/forgot-password',
  resetPassword: '/api/v1/auth/reset-password',
  verifyEmail: '/api/v1/auth/verify-email',
  sendEmailVerification: '/api/v1/auth/send-email-verification',
  deactivate: '/api/v1/auth/deactivate',
  validateToken: '/api/v1/auth/validate-token',
  health: '/api/v1/health',
  docs: '/api/v1/docs'
};

export const expectedResponses = {
  success: {
    status: 200,
    hasSuccess: true,
    hasData: true
  },
  created: {
    status: 201,
    hasSuccess: true,
    hasData: true
  },
  badRequest: {
    status: 400,
    hasSuccess: false,
    hasErrors: true
  },
  unauthorized: {
    status: 401,
    hasSuccess: false
  },
  forbidden: {
    status: 403,
    hasSuccess: false
  },
  notFound: {
    status: 404,
    hasSuccess: false
  },
  conflict: {
    status: 409,
    hasSuccess: false
  },
  tooManyRequests: {
    status: 429,
    hasSuccess: false
  }
};
