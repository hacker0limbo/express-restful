import { Document, Schema } from 'mongoose'

// post 对象接口
export default interface Post extends Document {
  content: string
  title: string
  author?: Schema.Types.ObjectId
}