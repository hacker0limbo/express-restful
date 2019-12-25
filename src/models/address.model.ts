import * as mongoose from 'mongoose'

export const addressSchema = new mongoose.Schema({
  city: String,
  street: String,
})