import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import DuplicateEmailException from '../exceptions/DuplicateEmailException'
import UserModel from '../models/user.model'
import UserDto from '../dto/user.dto'
import Token from '../interfaces/token.interface'
import TokenPayload from '../interfaces/tokenPayload.interface'
import User from '../interfaces/user.interface'

export default class AuthenticationService {

  public register = async (userData: UserDto) => {
    // 注册验证, 验证邮箱是否重复
    if (await UserModel.findOne({ email: userData.email })) {
      throw new DuplicateEmailException(userData.email)
    } else {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      const user = await UserModel.create({
        ...userData,
        password: hashedPassword
      })
      user.set('password', undefined)

      return { user }
    }
  }

  public createToken(user: User, expiresIn=(60 * 60 * 1000)): Token {
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