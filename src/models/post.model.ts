import * as mongoose from 'mongoose'
import Post from '../interfaces/post.interface'

const postSchema = new mongoose.Schema({
  author: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  },
  content: String,
  title: String,
})

// 使用 intersection type, 将多个类型联合成一个
const PostModel = mongoose.model<Post>('Post', postSchema)

export default PostModel