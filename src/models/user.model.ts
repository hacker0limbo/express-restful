import { addressSchema } from './address.model';
import * as mongoose from 'mongoose'
import User from '../interfaces/user.interface'

// 假设 user 和 address 是一对一关系, 直接 embedding 进 user, 相当于只有一个 user document
const userSchema = new mongoose.Schema({
  address: addressSchema,
  name: String,
  email: String,
  password: String,
})

const UserModel = mongoose.model<User>('User', userSchema)

export default UserModel