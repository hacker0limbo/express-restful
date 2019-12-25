import { Request } from 'express'
import User from './user.interface'

// 自定义 request, 该 request 为登录之后的用户发送过来的请求, 带有 cookie auth 字段
export default interface UserRequest extends Request {
  user: User
}