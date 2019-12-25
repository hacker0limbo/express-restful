import HttpException from './HttpException'

export default class PostNotFoundException extends HttpException {
  constructor(id: string) {
    super(404, `Post with id ${id} not found`)
  }
}