import { faker } from '@faker-js/faker';

/**
 * Test Data Fixtures
 * Provides test data for profile service testing
 */

export const createTestUser = (overrides = {}) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
  gender: faker.helpers.arrayElement(['male', 'female', 'other', 'prefer-not-to-say']),
  bio: faker.lorem.sentence(20),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    postalCode: faker.location.zipCode()
  },
  occupation: faker.person.jobTitle(),
  company: faker.company.name(),
  website: faker.internet.url(),
  socialLinks: {
    linkedin: `https://linkedin.com/in/${faker.internet.userName()}`,
    twitter: `https://twitter.com/${faker.internet.userName()}`,
    github: `https://github.com/${faker.internet.userName()}`,
    instagram: `https://instagram.com/${faker.internet.userName()}`
  },
  preferences: {
    emailNotifications: faker.datatype.boolean(),
    smsNotifications: faker.datatype.boolean(),
    profileVisibility: faker.helpers.arrayElement(['public', 'private', 'friends-only']),
    language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']),
    timezone: faker.location.timeZone()
  },
  role: faker.helpers.arrayElement(['user', 'admin', 'moderator']),
  isActive: true,
  ...overrides
});

export const createTestProfileUpdate = (overrides = {}) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number(),
  bio: faker.lorem.sentence(15),
  occupation: faker.person.jobTitle(),
  company: faker.company.name(),
  website: faker.internet.url(),
  ...overrides
});

export const createTestDocument = (overrides = {}) => ({
  name: faker.system.fileName(),
  type: faker.helpers.arrayElement(['resume', 'certificate', 'portfolio', 'other']),
  ...overrides
});

export const createTestSearchQuery = (overrides = {}) => ({
  q: faker.lorem.word(),
  limit: faker.number.int({ min: 1, max: 50 }),
  page: faker.number.int({ min: 1, max: 10 }),
  ...overrides
});

export const createTestPaginationQuery = (overrides = {}) => ({
  page: faker.number.int({ min: 1, max: 10 }),
  limit: faker.number.int({ min: 1, max: 50 }),
  sort: faker.helpers.arrayElement(['firstName', 'lastName', 'email', 'createdAt', 'lastProfileUpdate']),
  order: faker.helpers.arrayElement(['asc', 'desc']),
  ...overrides
});

export const createTestFilterQuery = (overrides = {}) => ({
  occupation: faker.person.jobTitle(),
  city: faker.location.city(),
  country: faker.location.country(),
  gender: faker.helpers.arrayElement(['male', 'female', 'other', 'prefer-not-to-say']),
  role: faker.helpers.arrayElement(['user', 'admin', 'moderator']),
  ...overrides
});

export const createTestJWT = (payload = {}) => {
  const defaultPayload = {
    id: faker.database.mongodbObjectId(),
    email: faker.internet.email(),
    role: 'user',
    sessionId: faker.string.uuid(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  return {
    ...defaultPayload,
    ...payload
  };
};

export const createTestFile = (overrides = {}) => ({
  fieldname: 'profileImage',
  originalname: faker.system.fileName(),
  encoding: '7bit',
  mimetype: faker.helpers.arrayElement(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  size: faker.number.int({ min: 1000, max: 5000000 }),
  path: `/tmp/${faker.string.uuid()}.jpg`,
  filename: `${faker.string.uuid()}.jpg`,
  ...overrides
});

export const createTestDocumentFile = (overrides = {}) => ({
  fieldname: 'documents',
  originalname: faker.system.fileName(),
  encoding: '7bit',
  mimetype: faker.helpers.arrayElement(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  size: faker.number.int({ min: 1000, max: 10000000 }),
  path: `/tmp/${faker.string.uuid()}.pdf`,
  filename: `${faker.string.uuid()}.pdf`,
  ...overrides
});

export const testUsers = Array.from({ length: 10 }, () => createTestUser());
export const testProfileUpdates = Array.from({ length: 5 }, () => createTestProfileUpdate());
export const testDocuments = Array.from({ length: 3 }, () => createTestDocument());
export const testSearchQueries = Array.from({ length: 5 }, () => createTestSearchQuery());
export const testPaginationQueries = Array.from({ length: 3 }, () => createTestPaginationQuery());
export const testFilterQueries = Array.from({ length: 3 }, () => createTestFilterQuery());
export const testFiles = Array.from({ length: 3 }, () => createTestFile());
export const testDocumentFiles = Array.from({ length: 2 }, () => createTestDocumentFile());
