import HttpException from './HttpException'

export default class DuplicateEmailException extends HttpException {
  constructor(email: string) {
    super(400, `Email ${email} already exists`)
  }
}