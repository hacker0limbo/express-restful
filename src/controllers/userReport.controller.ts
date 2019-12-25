import { Request, Response, NextFunction, Router } from 'express'
import Controller from '../interfaces/controller.interface'
import { getUsersByCountries } from '../operations/user.operation'

export default class UserReportController implements Controller {
  public path: string
  public router: Router

  constructor() {
    this.path = '/report/user'
    this.router = Router()

    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.generateUserReport)
  }

  private async generateUserReport(req: Request, res: Response, next: NextFunction) {
    const usersByCountries = await getUsersByCountries()
    res.json(usersByCountries)
  }
}