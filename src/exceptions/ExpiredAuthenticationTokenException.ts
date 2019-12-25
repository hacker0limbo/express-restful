import HttpException from './HttpException'

export default class ExpiredAuthenticationTokenException extends HttpException {
  constructor(type: string, msg: string) {
    super(401, `${type}: ${msg}`)
  }
}