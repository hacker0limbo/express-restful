import Address from './address.interface'
import { Document } from 'mongoose'

export default interface User extends Document {
  name: string
  email: string
  password: string
  address?: Address
}