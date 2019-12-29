import * as bcrypt from 'bcrypt'
import * as express from 'express'
import { Router, Request, Response, NextFunction } from 'express'
import Controller from "../interfaces/controller.interface"
import InvalidCredentialsException from '../exceptions/InvalidCredentialsException'
import validationMiddleware from '../middleware/validation.middleware'
import UserModel from '../models/user.model'
import LoginDto from '../dto/login.dto'
import UserDto from '../dto/user.dto'
import AuthenticationService from '../authentication/authentication.service'

export default class AuthenticationController implements Controller {
  public path: string
  public router: Router
  private authenticationService: AuthenticationService

  constructor() {
    this.path = '/auth'  
    this.router = express.Router()

    this.authenticationService = new AuthenticationService()

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
      // 如果用户存在已注册, 则验证密码
      if (await bcrypt.compare(loginData.password, user.password)) {
        user.set('password', undefined)

        const tokenData = this.authenticationService.createToken(user)
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
    try {
      const { user } = await this.authenticationService.register(userData)
      res.json(user)
    } catch (error) {
      next(error)  
    }
  }

  private logout(req: Request, res: Response) {
    res.clearCookie('authorization')
    res.sendStatus(200)
  }

}