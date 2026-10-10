const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const {
  createRecord,
  getAllRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  downloadPDF,
} = require('../controllers/recordsController');

// Multer field config
const photoFields = upload.fields([
  { name: 'inverterPhoto', maxCount: 1 },
  { name: 'panelPhoto', maxCount: 1 },
  { name: 'earthPhoto', maxCount: 1 },
  { name: 'laPhoto', maxCount: 1 },
  { name: 'additionalPhoto', maxCount: 1 },
]);

// Public: submit new consumer record
router.post('/', photoFields, handleMulterError, createRecord);

// Admin protected routes
router.get('/', authMiddleware, getAllRecords);
router.get('/:id', authMiddleware, getRecord);
router.put('/:id', authMiddleware, photoFields, handleMulterError, updateRecord);
router.delete('/:id', authMiddleware, deleteRecord);
router.get('/:id/pdf', authMiddleware, downloadPDF);

module.exports = router;
