import { Types } from 'mongoose';
import { IntakeBatch } from '../entity/intake-batches.entity';
import { UserRole, UserStatus } from '../entity/user.entity';

export type UserInterface = {
  _id: Types.ObjectId;
  username: string;

  password: string;

  fullName: string;

  role: UserRole;

  email: string;

  phoneNumber: string;

  ieltsScore: number;

  englishLevel: number;

  batch: IntakeBatch[];

  dateOfBirth: Date;

  address: string;

  status: UserStatus;

  lastLogin: Date;
};
