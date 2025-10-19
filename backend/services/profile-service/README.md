# Profile Service

A comprehensive profile management microservice for GC Group, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Profile Management**: Create, read, update, and delete user profiles
- **Image Upload**: Profile image upload with automatic thumbnail generation
- **Document Management**: Upload and manage user documents
- **Search & Filtering**: Advanced search and filtering capabilities
- **Pagination**: Efficient data pagination for large datasets
- **Authentication**: JWT-based authentication integration
- **Validation**: Comprehensive input validation
- **Error Handling**: Centralized error handling and logging
- **Testing**: Unit, integration, and load testing
- **Documentation**: Comprehensive API documentation

## 📁 Project Structure

```
profile-service/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── config.js          # Main configuration
│   │   └── database.js        # Database connection
│   ├── controllers/           # Request handlers
│   │   └── profile/
│   │       └── profileController.js
│   ├── interfaces/            # Request/Response interfaces
│   │   ├── requests/
│   │   │   └── ProfileRequests.js
│   │   └── responses/
│   │       └── ProfileResponses.js
│   ├── middleware/            # Custom middleware
│   │   ├── auth/
│   │   │   └── authMiddleware.js
│   │   ├── error/
│   │   │   └── errorMiddleware.js
│   │   ├── upload/
│   │   │   └── uploadMiddleware.js
│   │   └── validation/
│   │       └── validationMiddleware.js
│   ├── models/                # Database models
│   │   └── User.js
│   ├── repositories/          # Data access layer
│   │   ├── interfaces/
│   │   │   └── IUserRepository.js
│   │   └── implementations/
│   │       └── UserRepository.js
│   ├── routes/                # API routes
│   │   └── v1/
│   │       └── profileRoutes.js
│   ├── services/              # Business logic
│   │   ├── interfaces/
│   │   │   └── IProfileService.js
│   │   └── implementations/
│   │       └── ProfileService.js
│   ├── uploads/               # File uploads
│   │   ├── images/           # Profile images
│   │   └── documents/        # User documents
│   └── app.js                # Express application
├── tests/                     # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── fixtures/             # Test data
├── docs/                     # Documentation
├── .env                      # Environment variables
├── package.json              # Dependencies
├── server.js                 # Entry point
└── README.md                 # This file
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd profile-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the service**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3002
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
DB_NAME=gc_group

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
UPLOAD_PATH=./src/uploads

# Image Processing
IMAGE_QUALITY=80
THUMBNAIL_SIZE=200
PROFILE_IMAGE_SIZE=400

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Auth Service Configuration
AUTH_SERVICE_URL=http://localhost:3001
```

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/profiles` | Get profiles with pagination |
| GET | `/api/v1/profiles/search` | Search profiles |
| GET | `/api/v1/profiles/occupation/:occupation` | Get profiles by occupation |
| GET | `/api/v1/profiles/location` | Get profiles by location |
| GET | `/api/v1/profiles/statistics` | Get user statistics |

### Protected Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profiles/me` | Get current user's profile |
| PUT | `/api/v1/profiles/me` | Update current user's profile |
| POST | `/api/v1/profiles/me/image` | Upload profile image |
| DELETE | `/api/v1/profiles/me/image` | Delete profile image |
| POST | `/api/v1/profiles/me/documents` | Upload document |
| DELETE | `/api/v1/profiles/me/documents/:id` | Delete document |

### Admin Endpoints (Require Admin/Moderator Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profiles/:id` | Get user profile by ID |
| PUT | `/api/v1/profiles/:id` | Update user profile by ID |
| POST | `/api/v1/profiles/:id/image` | Upload profile image for user |
| DELETE | `/api/v1/profiles/:id/image` | Delete profile image for user |
| POST | `/api/v1/profiles/:id/documents` | Upload document for user |
| DELETE | `/api/v1/profiles/:id/documents/:id` | Delete document for user |

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/profiles/webhook/create` | Create profile (from auth service) |
| DELETE | `/api/v1/profiles/webhook/:id` | Delete profile (from auth service) |

## 🔐 Authentication

The service uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📝 Request/Response Examples

### Get Profile

**Request:**
```bash
GET /api/v1/profiles/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "profileImage": {
      "original": {
        "url": "/uploads/images/profile.jpg",
        "filename": "profile.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg"
      },
      "thumbnail": {
        "url": "/uploads/images/profile-thumb.jpg",
        "filename": "profile-thumb.jpg",
        "size": 51200
      }
    },
    "bio": "Software Developer",
    "occupation": "Developer",
    "company": "Tech Corp",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile

**Request:**
```bash
PUT /api/v1/profiles/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "occupation": "Senior Developer",
  "company": "New Tech Corp"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Updated bio",
    "occupation": "Senior Developer",
    "company": "New Tech Corp",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Upload Profile Image

**Request:**
```bash
POST /api/v1/profiles/me/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

profileImage: <file>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile image uploaded successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "profileImage": {
        "original": {
          "url": "/uploads/images/unique-filename.jpg",
          "filename": "unique-filename.jpg",
          "size": 1024000,
          "mimeType": "image/jpeg"
        },
        "thumbnail": {
          "url": "/uploads/images/unique-filename-thumb.jpg",
          "filename": "unique-filename-thumb.jpg",
          "size": 51200
        }
      }
    },
    "imageData": {
      "original": { ... },
      "thumbnail": { ... },
      "profile": { ... }
    }
  }
}
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run load tests
npm run test:load
```

### API Testing

```bash
# Make the test script executable
chmod +x test-profile-api.sh

# Run API tests
./test-profile-api.sh
```

## 🚀 Deployment

### Docker

```bash
# Build Docker image
docker build -t profile-service .

# Run container
docker run -p 3002:3002 --env-file .env profile-service
```

### Environment Setup

1. Set up MongoDB database
2. Configure environment variables
3. Install dependencies: `npm install`
4. Start the service: `npm start`

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Metrics**: Available through health endpoint
- **Logging**: Structured logging with configurable levels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Ganesh Patel**
- Email: ganeshpatel@example.com
- GitHub: [@ganeshpatel](https://github.com/ganeshpatel)

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: ganeshpatel@example.com

---

**Profile Service v1.0.0** - Built with ❤️ by Ganesh Patel
