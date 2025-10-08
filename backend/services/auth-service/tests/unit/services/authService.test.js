import AuthService from '../../../src/services/implementations/AuthService.js';
import UserRepository from '../../../src/repositories/implementations/UserRepository.js';
import User from '../../../src/models/User.js';
import { validUserData, adminUserData, loginCredentials } from '../../fixtures/testData.js';
import TestHelpers from '../../helpers/testHelpers.js';

// Mock dependencies
jest.mock('../../../src/repositories/implementations/UserRepository.js');
jest.mock('../../../src/models/User.js');

describe('AuthService Unit Tests', () => {
  let authService;
  let mockUserRepository;

  beforeEach(() => {
    authService = new AuthService();
    mockUserRepository = new UserRepository();
    authService.userRepository = mockUserRepository;
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = { ...validUserData };
      const mockUser = { _id: 'user123', ...userData };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockUserRepository.addRefreshToken.mockResolvedValue(mockUser);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(mockUserRepository.addRefreshToken).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(userData.email);
      expect(result.data.tokens.accessToken).toBeDefined();
      expect(result.data.tokens.refreshToken).toBeDefined();
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const userData = { ...validUserData };
      const existingUser = { _id: 'user123', ...userData };
      
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      // Arrange
      const userData = { ...validUserData };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const { email, password } = loginCredentials.valid;
      const mockUser = {
        _id: 'user123',
        email,
        password: 'hashedPassword',
        isActive: true,
        isLocked: false,
        loginAttempts: 0,
        comparePassword: jest.fn().mockResolvedValue(true),
        incLoginAttempts: jest.fn(),
        resetLoginAttempts: jest.fn()
      };
      
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUserRepository.updateLastLogin.mockResolvedValue(mockUser);
      mockUserRepository.addRefreshToken.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
      expect(mockUser.resetLoginAttempts).toHaveBeenCalled();
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(mockUser._id);
      expect(result.success).toBe(true);
      expect(result.data.tokens.accessToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      const { email, password } = loginCredentials.invalid;
      const mockUser = {
        _id: 'user123',
        email,
        password: 'hashedPassword',
        isActive: true,
        isLocked: false,
        loginAttempts: 0,
        comparePassword: jest.fn().mockResolvedValue(false),
        incLoginAttempts: jest.fn()
      };
      
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Invalid email or password');
      expect(mockUser.incLoginAttempts).toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const { email, password } = loginCredentials.nonExistent;
      
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for locked account', async () => {
      // Arrange
      const { email, password } = loginCredentials.valid;
      const mockUser = {
        _id: 'user123',
        email,
        password: 'hashedPassword',
        isActive: true,
        isLocked: true,
        loginAttempts: 5
      };
      
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Account is temporarily locked');
    });

    it('should throw error for deactivated account', async () => {
      // Arrange
      const { email, password } = loginCredentials.valid;
      const mockUser = {
        _id: 'user123',
        email,
        password: 'hashedPassword',
        isActive: false,
        isLocked: false
      };
      
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Account is deactivated');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const userId = 'user123';
      const refreshToken = 'refreshToken123';
      
      mockUserRepository.removeRefreshToken.mockResolvedValue({});

      // Act
      const result = await authService.logout(userId, refreshToken);

      // Assert
      expect(mockUserRepository.removeRefreshToken).toHaveBeenCalledWith(userId, refreshToken);
      expect(result.success).toBe(true);
    });

    it('should logout user without refresh token', async () => {
      // Arrange
      const userId = 'user123';
      
      mockUserRepository.removeAllRefreshTokens.mockResolvedValue({});

      // Act
      const result = await authService.logout(userId);

      // Assert
      expect(mockUserRepository.removeAllRefreshTokens).toHaveBeenCalledWith(userId);
      expect(result.success).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'validRefreshToken';
      const decoded = { id: 'user123', email: 'test@example.com', role: 'user' };
      const mockUser = { _id: 'user123', email: 'test@example.com', role: 'user' };
      
      jest.spyOn(authService, 'verifyToken').mockReturnValue(decoded);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.removeRefreshToken.mockResolvedValue(mockUser);
      mockUserRepository.addRefreshToken.mockResolvedValue(mockUser);

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith(refreshToken, expect.any(String));
      expect(mockUserRepository.findById).toHaveBeenCalledWith(decoded.id);
      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBeDefined();
      expect(result.data.refreshToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalidToken';
      
      jest.spyOn(authService, 'verifyToken').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const refreshToken = 'validRefreshToken';
      const decoded = { id: 'user123', email: 'test@example.com', role: 'user' };
      
      jest.spyOn(authService, 'verifyToken').mockReturnValue(decoded);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('User not found');
    });
  });

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', () => {
      // Arrange
      const payload = { id: 'user123', email: 'test@example.com', role: 'user' };

      // Act
      const tokens = authService.generateTokens(payload);

      // Assert
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      
      // Verify tokens are valid
      const accessDecoded = TestHelpers.validateToken(tokens.accessToken);
      const refreshDecoded = TestHelpers.validateToken(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);
      
      expect(accessDecoded).toBeTruthy();
      expect(refreshDecoded).toBeTruthy();
      expect(accessDecoded.id).toBe(payload.id);
      expect(refreshDecoded.id).toBe(payload.id);
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', async () => {
      // Arrange
      const payload = { id: 'user123', email: 'test@example.com', role: 'user' };
      const token = TestHelpers.generateToken(payload);
      const mockUser = { _id: 'user123', email: 'test@example.com', role: 'user', isActive: true };
      
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(payload.id);
    });

    it('should reject invalid token', async () => {
      // Arrange
      const token = 'invalid.token.here';

      // Act & Assert
      await expect(authService.validateToken(token)).rejects.toThrow();
    });

    it('should reject token for inactive user', async () => {
      // Arrange
      const payload = { id: 'user123', email: 'test@example.com', role: 'user' };
      const token = TestHelpers.generateToken(payload);
      const mockUser = { _id: 'user123', email: 'test@example.com', role: 'user', isActive: false };
      
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.validateToken(token)).rejects.toThrow('Invalid token');
    });
  });
});
