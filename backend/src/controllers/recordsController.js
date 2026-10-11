const ConsumerRecord = require('../models/ConsumerRecord');
const { uploadToCloudinary, deleteFromCloudinary, deleteMultipleFromCloudinary } = require('../services/cloudinaryService');
const { generatePDF } = require('../utils/pdfGenerator');

const ALLOWED_CAPACITIES = ['1 KW', '2 KW', '3 KW', '4 KW', '5 KW', '6 KW', '7 KW', '8 KW', '9 KW', '10 KW'];

// Helper: upload a single photo from req.files
const uploadPhoto = async (file, folder) => {
  if (!file) return null;
  return await uploadToCloudinary(file.buffer, folder);
};

// ─── CREATE RECORD ────────────────────────────────────────────────────────────
const createRecord = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    const {
      consumerName, consumerNo, contactNumber, applicationRefNo,
      subDivision, address, plantCapacity, installationDate, commissioningDate,
    } = req.body;

    // Validate required text fields
    if (!consumerName || !consumerNo || !contactNumber || !applicationRefNo || !subDivision || !address) {
      return res.status(400).json({ success: false, message: 'All consumer information fields are required.' });
    }

    if (!plantCapacity || !ALLOWED_CAPACITIES.includes(plantCapacity)) {
      return res.status(400).json({ success: false, message: 'Invalid plant capacity. Choose from 1 KW to 10 KW.' });
    }

    if (!installationDate) {
      return res.status(400).json({ success: false, message: 'Installation Date is required.' });
    }

    // Validate required photos
    const files = req.files || {};
    if (!files.inverterPhoto || !files.inverterPhoto[0]) {
      return res.status(400).json({ success: false, message: 'Inverter Photo is required.' });
    }
    if (!files.panelPhoto || !files.panelPhoto[0]) {
      return res.status(400).json({ success: false, message: 'Panel Photo is required.' });
    }
    if (!files.earthPhoto || !files.earthPhoto[0]) {
      return res.status(400).json({ success: false, message: 'Earth Photo is required.' });
    }
    if (!files.laPhoto || !files.laPhoto[0]) {
      return res.status(400).json({ success: false, message: 'LA Photo is required.' });
    }

    // Upload all photos to Cloudinary
    const [inverterPhoto, panelPhoto, earthPhoto, laPhoto] = await Promise.all([
      uploadPhoto(files.inverterPhoto[0], 'inverter'),
      uploadPhoto(files.panelPhoto[0], 'panel'),
      uploadPhoto(files.earthPhoto[0], 'earth'),
      uploadPhoto(files.laPhoto[0], 'la'),
    ]);

    uploadedPublicIds.push(inverterPhoto.publicId, panelPhoto.publicId, earthPhoto.publicId, laPhoto.publicId);

    let additionalPhoto = null;
    if (files.additionalPhoto && files.additionalPhoto[0]) {
      additionalPhoto = await uploadPhoto(files.additionalPhoto[0], 'additional');
      uploadedPublicIds.push(additionalPhoto.publicId);
    }

    const record = await ConsumerRecord.create({
      consumerName: consumerName.trim(),
      consumerNo: consumerNo.trim(),
      contactNumber: contactNumber.trim(),
      applicationRefNo: applicationRefNo.trim(),
      subDivision: subDivision.trim(),
      address: address.trim(),
      plantCapacity,
      vendorName: 'DRT ENTERPRISE',
      installationDate: new Date(installationDate),
      commissioningDate: commissioningDate ? new Date(commissioningDate) : null,
      inverterPhoto,
      panelPhoto,
      earthPhoto,
      laPhoto,
      additionalPhoto,
    });

    res.status(201).json({
      success: true,
      message: 'Consumer record saved successfully.',
      data: record,
    });

  } catch (error) {
    console.error('Create record error:', error);
    // Clean up any uploaded images if DB save failed
    if (uploadedPublicIds.length > 0) {
      await deleteMultipleFromCloudinary(uploadedPublicIds.map(id => ({ publicId: id })));
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to save record.' });
  }
};

// ─── GET ALL RECORDS ─────────────────────────────────────────────────────────
const getAllRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query = {
        $or: [
          { consumerName: regex },
          { consumerNo: regex },
          { contactNumber: regex },
          { applicationRefNo: regex },
        ],
      };
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const allowedSortFields = ['consumerName', 'consumerNo', 'plantCapacity', 'installationDate', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [records, total] = await Promise.all([
      ConsumerRecord.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      ConsumerRecord.countDocuments(query),
    ]);

    // Stats
    const allRecords = await ConsumerRecord.find({}, 'plantCapacity');
    const totalCapacity = allRecords.reduce((sum, r) => {
      const kw = parseInt(r.plantCapacity);
      return sum + (isNaN(kw) ? 0 : kw);
    }, 0);

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        totalRecords: await ConsumerRecord.countDocuments(),
        totalCapacityKW: totalCapacity,
      },
    });

  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch records.' });
  }
};

// ─── GET SINGLE RECORD ───────────────────────────────────────────────────────
const getRecord = async (req, res) => {
  try {
    const record = await ConsumerRecord.findById(req.params.id).select('-__v');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Get record error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid record ID.' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch record.' });
  }
};

// ─── UPDATE RECORD ───────────────────────────────────────────────────────────
const updateRecord = async (req, res) => {
  const newlyUploadedIds = [];

  try {
    const record = await ConsumerRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    const {
      consumerName, consumerNo, contactNumber, applicationRefNo,
      subDivision, address, plantCapacity, installationDate, commissioningDate,
    } = req.body;

    if (plantCapacity && !ALLOWED_CAPACITIES.includes(plantCapacity)) {
      return res.status(400).json({ success: false, message: 'Invalid plant capacity.' });
    }

    // Build update object
    const updateData = {
      vendorName: 'DRT ENTERPRISE',
    };

    if (consumerName) updateData.consumerName = consumerName.trim();
    if (consumerNo) updateData.consumerNo = consumerNo.trim();
    if (contactNumber) updateData.contactNumber = contactNumber.trim();
    if (applicationRefNo) updateData.applicationRefNo = applicationRefNo.trim();
    if (subDivision) updateData.subDivision = subDivision.trim();
    if (address) updateData.address = address.trim();
    if (plantCapacity) updateData.plantCapacity = plantCapacity;
    if (installationDate) updateData.installationDate = new Date(installationDate);
    if (commissioningDate !== undefined) {
      updateData.commissioningDate = commissioningDate ? new Date(commissioningDate) : null;
    }

    const files = req.files || {};
    const photosToDelete = [];

    // Process each photo field — only replace if new file uploaded
    const photoFields = [
      { field: 'inverterPhoto', folder: 'inverter' },
      { field: 'panelPhoto', folder: 'panel' },
      { field: 'earthPhoto', folder: 'earth' },
      { field: 'laPhoto', folder: 'la' },
      { field: 'additionalPhoto', folder: 'additional' },
    ];

    for (const { field, folder } of photoFields) {
      if (files[field] && files[field][0]) {
        const uploaded = await uploadToCloudinary(files[field][0].buffer, folder);
        newlyUploadedIds.push(uploaded.publicId);
        // Mark old image for deletion
        if (record[field] && record[field].publicId) {
          photosToDelete.push(record[field].publicId);
        }
        updateData[field] = uploaded;
      }
    }

    // Handle additionalPhoto removal (if explicitly set to empty)
    if (req.body.removeAdditionalPhoto === 'true' && record.additionalPhoto) {
      photosToDelete.push(record.additionalPhoto.publicId);
      updateData.additionalPhoto = null;
    }

    const updated = await ConsumerRecord.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Delete old images only after successful DB update
    await deleteMultipleFromCloudinary(photosToDelete.map(id => ({ publicId: id })));

    res.json({ success: true, message: 'Record updated successfully.', data: updated });

  } catch (error) {
    console.error('Update record error:', error);
    // Cleanup any newly uploaded images if update failed
    await deleteMultipleFromCloudinary(newlyUploadedIds.map(id => ({ publicId: id })));
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid record ID.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update record.' });
  }
};

// ─── DELETE RECORD ───────────────────────────────────────────────────────────
const deleteRecord = async (req, res) => {
  try {
    const record = await ConsumerRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    // Collect all photo public IDs
    const photos = [
      record.inverterPhoto,
      record.panelPhoto,
      record.earthPhoto,
      record.laPhoto,
      record.additionalPhoto,
    ].filter(Boolean);

    await ConsumerRecord.findByIdAndDelete(req.params.id);

    // Delete Cloudinary assets after DB delete
    await deleteMultipleFromCloudinary(photos);

    res.json({ success: true, message: 'Record deleted successfully.' });

  } catch (error) {
    console.error('Delete record error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid record ID.' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete record.' });
  }
};

// ─── DOWNLOAD PDF ─────────────────────────────────────────────────────────────
const downloadPDF = async (req, res) => {
  try {
    const record = await ConsumerRecord.findById(req.params.id).select('-__v');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    const pdfBuffer = await generatePDF(record);

    const safeName = record.consumerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `DRT_Solar_${safeName}_${record._id}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate PDF.' });
    }
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  downloadPDF,
};
