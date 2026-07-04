import { config } from 'dotenv';
config();
export const jwt_constants = {
  secret: process.env.JWT_SECRET,
};
