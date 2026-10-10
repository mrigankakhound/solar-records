const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Cloudinary folder
 * @param {string} [publicId] - Optional public ID (for replacements)
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: `drt-solar-records/${folder}`,
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
    };

    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
      options.invalidate = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(new Error(`Cloudinary upload failed: ${error.message}`));
      } else {
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an image from Cloudinary by public ID
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️  Deleted Cloudinary asset: ${publicId}`);
  } catch (error) {
    console.error(`⚠️  Failed to delete Cloudinary asset ${publicId}:`, error.message);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<{publicId: string}>} photos
 */
const deleteMultipleFromCloudinary = async (photos) => {
  if (!photos || !photos.length) return;
  const validPhotos = photos.filter(p => p && p.publicId);
  await Promise.allSettled(validPhotos.map(p => deleteFromCloudinary(p.publicId)));
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
};
