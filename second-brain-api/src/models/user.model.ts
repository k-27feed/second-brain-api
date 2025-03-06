import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Define the user document interface
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isVerified: boolean;
  verificationCode?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

// Define the user schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function (): string {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
  return token;
};

// Create and export the User model
const User = mongoose.model<IUser>('User', userSchema);
export default User; 