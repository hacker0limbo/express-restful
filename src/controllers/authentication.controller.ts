import * as bcrypt from 'bcrypt'
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { Router, Request, Response, NextFunction } from 'express'
import Controller from "../interfaces/controller.interface"
import DuplicateEmailException from '../exceptions/DuplicateEmailException'
import InvalidCredentialsException from '../exceptions/InvalidCredentialsException'
import validationMiddleware from '../middleware/validation.middleware'
import UserModel from '../models/user.model'
import LoginDto from '../dto/login.dto'
import UserDto from '../dto/user.dto'
import Token from '../interfaces/token.interface'
import TokenPayload from '../interfaces/tokenPayload.interface'
import User from '../interfaces/user.interface'

export default class AuthenticationController implements Controller {
  public path: string
  public router: Router

  constructor() {
    this.path = '/auth'  
    this.router = express.Router()

    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, validationMiddleware(UserDto), this.register)
    this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login)
    this.router.post(`${this.path}/logout`, this.logout)
  }

  private login = async (req: Request, res: Response, next: NextFunction) => {
    // 登录验证, 验证邮箱, 密码是否正确
    const loginData: LoginDto = req.body
    const user = await UserModel.findOne({ email: loginData.email })
    if (user) {
      // 如果用户存在已注册, 则验证邮箱
      if (await bcrypt.compare(loginData.password, user.password)) {
        user.set('password', undefined)

        const tokenData = this.createToken(user)
        // 注册成功以后设置 cookie, 将 token 存入
        // 或者将 token 返回给客户端, 并设置客户端的 auth headers
        res.cookie('authorization', tokenData.token, {
          maxAge: tokenData.expiresIn,
          httpOnly: true
        })
        // 返回用户信息
        res.json(user)
      } else {
        // 密码错误
        next(new InvalidCredentialsException())
      }
    } else {
      // 用户没有注册, 或邮箱错误
      next(new InvalidCredentialsException())
    }
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    // 注册验证, 验证邮箱是否重复
    const userData: UserDto = req.body
    if (await UserModel.findOne({ email: userData.email })) {
      next(new DuplicateEmailException(userData.email))
    } else {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      const user = await UserModel.create({
        ...userData,
        password: hashedPassword
      })
      user.set('password', undefined)

      // 返回 user 对象给客户端
      res.json(user)
    }
  }

  private logout(req: Request, res: Response) {
    res.clearCookie('authorization')
    res.sendStatus(200)
  }

  private createToken(user: User, expiresIn=(60 * 60 * 1000)): Token {
    // 设定 token 一分钟以后过期(默认)
    const privateKey = process.env.PRIVATE_KEY || 'private_key'
    const tokenPayload: TokenPayload = {
      _id: user.id
    }

    return {
      expiresIn,
      token: jwt.sign(tokenPayload, privateKey, { expiresIn })
    }
  }
}