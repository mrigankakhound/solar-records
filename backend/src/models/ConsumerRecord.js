const mongoose = require('mongoose');

// Sub-schema for photo fields
const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const consumerRecordSchema = new mongoose.Schema(
  {
    // Section A: Consumer Information
    consumerName: {
      type: String,
      required: [true, 'Consumer Name is required'],
      trim: true,
      maxlength: [200, 'Consumer Name cannot exceed 200 characters'],
    },
    consumerNo: {
      type: String,
      required: [true, 'Consumer No is required'],
      trim: true,
      maxlength: [100, 'Consumer No cannot exceed 100 characters'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact Number is required'],
      trim: true,
      maxlength: [20, 'Contact Number cannot exceed 20 characters'],
    },
    applicationRefNo: {
      type: String,
      required: [true, 'Application Reference No is required'],
      trim: true,
      maxlength: [100, 'Application Ref No cannot exceed 100 characters'],
    },
    subDivision: {
      type: String,
      required: [true, 'Sub-Division is required'],
      trim: true,
      maxlength: [200, 'Sub-Division cannot exceed 200 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },

    // Section B: Installation Details
    plantCapacity: {
      type: String,
      required: [true, 'Plant Capacity is required'],
      enum: {
        values: ['1 KW', '2 KW', '3 KW', '4 KW', '5 KW', '6 KW', '7 KW', '8 KW', '9 KW', '10 KW'],
        message: 'Plant Capacity must be one of the allowed options',
      },
    },
    vendorName: {
      type: String,
      default: 'DRT ENTERPRISE',
      enum: {
        values: ['DRT ENTERPRISE'],
        message: 'Vendor Name must be DRT ENTERPRISE',
      },
    },
    installationDate: {
      type: Date,
      required: [true, 'Installation Date is required'],
    },
    commissioningDate: {
      type: Date,
      default: null,
    },

    // Section C: Photographs
    inverterPhoto: {
      type: photoSchema,
      required: [true, 'Inverter Photo is required'],
    },
    panelPhoto: {
      type: photoSchema,
      required: [true, 'Panel Photo is required'],
    },
    earthPhoto: {
      type: photoSchema,
      required: [true, 'Earth Photo is required'],
    },
    laPhoto: {
      type: photoSchema,
      required: [true, 'LA Photo is required'],
    },
    additionalPhoto: {
      type: photoSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for frequently searched fields
consumerRecordSchema.index({ consumerName: 'text', consumerNo: 'text', contactNumber: 'text', applicationRefNo: 'text' });
consumerRecordSchema.index({ createdAt: -1 });
consumerRecordSchema.index({ consumerNo: 1 });
consumerRecordSchema.index({ applicationRefNo: 1 });

// Always enforce vendorName
consumerRecordSchema.pre('save', function (next) {
  this.vendorName = 'DRT ENTERPRISE';
  next();
});

consumerRecordSchema.pre('findOneAndUpdate', function (next) {
  this.set({ vendorName: 'DRT ENTERPRISE' });
  next();
});

module.exports = mongoose.model('ConsumerRecord', consumerRecordSchema);
