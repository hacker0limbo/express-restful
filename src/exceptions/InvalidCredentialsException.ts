import HttpException from './HttpException'

// 错误凭据, 包括用户名密码错误, 一般为登录时候进行验证
// 401 状态码表示 unauthorized
export default class InvalidCredentialsException extends HttpException {
  constructor() {
    super(401, 'Wrong credentials provided')
  }
}