import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import config from '../../config/config.js';

/**
 * Upload Middleware
 * Handles file uploads with image processing
 */
class UploadMiddleware {
  constructor() {
    this.uploadPath = config.upload.uploadPath;
    this.ensureUploadDirectories();
  }

  /**
   * Ensure upload directories exist
   */
  async ensureUploadDirectories() {
    try {
      await fs.mkdir(path.join(this.uploadPath, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'documents'), { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  /**
   * Configure multer storage
   */
  getStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadType = file.fieldname === 'profileImage' ? 'images' : 'documents';
        cb(null, path.join(this.uploadPath, uploadType));
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }

  /**
   * File filter for validation
   */
  fileFilter() {
    return (req, file, cb) => {
      const isImage = file.fieldname === 'profileImage';
      const allowedTypes = isImage ? config.upload.allowedImageTypes : config.upload.allowedDocumentTypes;
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    };
  }

  /**
   * Get multer configuration
   */
  getMulterConfig() {
    return {
      storage: this.getStorage(),
      fileFilter: this.fileFilter(),
      limits: {
        fileSize: config.upload.maxFileSize,
        files: 5 // Maximum 5 files per request
      }
    };
  }

  /**
   * Process profile image
   */
  async processProfileImage(filePath, filename) {
    try {
      const baseName = path.parse(filename).name;
      const thumbnailPath = path.join(path.dirname(filePath), `${baseName}-thumb.jpg`);
      const profilePath = path.join(path.dirname(filePath), `${baseName}-profile.jpg`);

      // Create thumbnail
      await sharp(filePath)
        .resize(config.upload.thumbnailSize, config.upload.thumbnailSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: config.upload.imageQuality })
        .toFile(thumbnailPath);

      // Create profile image
      await sharp(filePath)
        .resize(config.upload.profileImageSize, config.upload.profileImageSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: config.upload.imageQuality })
        .toFile(profilePath);

      // Get file stats
      const [originalStats, thumbnailStats, profileStats] = await Promise.all([
        fs.stat(filePath),
        fs.stat(thumbnailPath),
        fs.stat(profilePath)
      ]);

      return {
        original: {
          url: `/uploads/images/${filename}`,
          filename: filename,
          size: originalStats.size,
          mimeType: 'image/jpeg'
        },
        thumbnail: {
          url: `/uploads/images/${baseName}-thumb.jpg`,
          filename: `${baseName}-thumb.jpg`,
          size: thumbnailStats.size
        },
        profile: {
          url: `/uploads/images/${baseName}-profile.jpg`,
          filename: `${baseName}-profile.jpg`,
          size: profileStats.size
        }
      };
    } catch (error) {
      throw new Error(`Failed to process profile image: ${error.message}`);
    }
  }

  /**
   * Process document
   */
  async processDocument(filePath, filename, mimeType) {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        url: `/uploads/documents/${filename}`,
        filename: filename,
        size: stats.size,
        mimeType: mimeType
      };
    } catch (error) {
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error.message);
    }
  }

  /**
   * Clean up old files
   */
  async cleanupOldFiles(directory, maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error.message);
    }
  }

  /**
   * Get upload middleware for profile images
   */
  profileImageUpload() {
    return multer({
      ...this.getMulterConfig(),
      limits: {
        fileSize: config.upload.maxFileSize,
        files: 1
      }
    }).single('profileImage');
  }

  /**
   * Get upload middleware for documents
   */
  documentUpload() {
    return multer({
      ...this.getMulterConfig(),
      limits: {
        fileSize: config.upload.maxFileSize,
        files: 5
      }
    }).array('documents', 5);
  }

  /**
   * Error handler for upload errors
   */
  handleUploadError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'File too large',
          error: `Maximum file size is ${config.upload.maxFileSize / 1024 / 1024}MB`
        });
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Too many files',
          error: 'Maximum 5 files allowed per request'
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Unexpected file field',
          error: 'Please use the correct field name for file upload'
        });
      }
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid file type',
        error: error.message
      });
    }
    
    next(error);
  }
}

export default new UploadMiddleware();
