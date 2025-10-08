# Auth Service

Authentication microservice for GC Group built with Node.js, Express, and MongoDB.

**Author:** Ganesh Patel

## Features

- User registration and authentication
- JWT-based access and refresh tokens
- Email verification
- Password reset functionality
- Role-based access control
- Rate limiting
- Input validation and sanitization
- Comprehensive error handling
- Docker support

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting, XSS Protection
- **Validation**: Express Validator
- **Documentation**: Built-in API docs
- **Module System**: ES6 Modules (import/export)

## Project Structure

```
auth-service/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── interfaces/       # Type definitions and contracts
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── tests/               # Test files
├── docs/               # Documentation
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
└── package.json        # Dependencies and scripts
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update environment variables in `.env`

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb+srv://gcgroupofficial158_db_user:zHfqFKf1vBJhnqY7@cluster0.3iyatym.mongodb.net/gc_group
DB_NAME=gc_group

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# Password Configuration
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user (protected)
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/verify-email/:token` - Verify email address
- `POST /api/v1/auth/send-email-verification` - Send email verification
- `POST /api/v1/auth/forgot-password` - Send password reset email
- `POST /api/v1/auth/reset-password` - Reset password with token
- `PUT /api/v1/auth/change-password` - Change password (protected)

### Profile Management
- `GET /api/v1/auth/profile` - Get user profile (protected)
- `PUT /api/v1/auth/profile` - Update user profile (protected)
- `DELETE /api/v1/auth/deactivate` - Deactivate account (protected)

### System
- `GET /api/v1/health` - Health check
- `GET /api/v1/docs` - API documentation

## API Documentation

Visit `http://localhost:3001/api/v1/docs` for complete API documentation.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- XSS protection
- MongoDB injection prevention
- Input validation and sanitization
- Account lockout after failed attempts

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors
npm run lint:fix
```

## Contributing

1. Follow SOLID principles
2. Write comprehensive tests
3. Update documentation
4. Follow the existing code style

## License

MIT License
