import mongoose from "mongoose";

const Schema = mongoose.Schema;

const staffSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Doctor', 'Groomer', 'Trainer', 'Dietitian'],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    hireDate: {
        type: Date,
        default: Date.now
    }
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;