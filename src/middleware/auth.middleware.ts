import { Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import InvalidAuthenticationTokenException from '../exceptions/InvalidAuthenticationTokenException'
import MissingAuthenticationTokenException from '../exceptions/MissingAuthenticationTokenException'
import ExpiredAuthenticationTokenException from '../exceptions/ExpiredAuthenticationTokenException'
import TokenPayload from '../interfaces/tokenPayload.interface'
import UserRequest from '../interfaces/userRequest.interface'
import UserModel from '../models/user.model'

/**
 * 验证客户端发送的请求头 headers 里面是否含有对应的 token, 否则返回错误
 * token 格式为: Bearer g1jipjgi1ifjioj
 * @param req 请求
 * @param res 响应
 * @param next next 函数
 */
const authMiddleware = async (req: Request | UserRequest, res: Response, next: NextFunction) => {
  
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    // 得到客户端发送的 token
    const token = req.headers.authorization.split(' ')[1]
    const privateKey = process.env.PRIVATE_KEY || 'private_key'
    
    try {
      const decoded = jwt.verify(token, privateKey) as TokenPayload
      const id = decoded._id
      const user = await UserModel.findById(id)
      if (user) {
        // 将 req 断言成 UserRequest, 增加 user 字段
        const request = req as UserRequest
        request.user = user
        // 移交给下一个中间件
        next()
      }
    } catch (error) {
      if ('expiredAt' in error) {
        const tokenExpiredError = error as TokenExpiredError
        next(new ExpiredAuthenticationTokenException(tokenExpiredError.name, tokenExpiredError.message))
      } else {
        const tokenInvalidError = error as JsonWebTokenError
        next(new InvalidAuthenticationTokenException(tokenInvalidError.name, tokenInvalidError.message))
      }
    }
  } else {
    next(new MissingAuthenticationTokenException())
  }
}

export default authMiddleware