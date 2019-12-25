import PostNotFoundException from '../exceptions/PostNotFoundException'
import * as mongoose from 'mongoose'

// 自定义装饰器, 检查访问 /posts/:id 时的 id 是否为有效的 mongodb id, 若无效直接使用 next 中间件跳转
export default function validateMongoID(target: any, name: string, descriptor: PropertyDescriptor) {
  const oldValue = descriptor.value

  descriptor.value = function() {
    const req = arguments[0]
    const next = arguments[2]
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new PostNotFoundException(id))
    } 
    return oldValue.apply(this, arguments)
  }

  return descriptor
}