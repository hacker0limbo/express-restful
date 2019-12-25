import HttpException from './HttpException'

export default class MissingAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, 'Authentication token missing')
  }
}