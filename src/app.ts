import * as express from 'express'
import { Application, } from 'express'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import * as mongoose from 'mongoose'
import Controller from './interfaces/controller.interface'
import errorMiddleware from './middleware/error.middleware'

export default class App {

  private app: Application

  constructor(controllers: Controller[]) {
    this.app = express()
    this.connectToDB()

    this.initializeMiddlewares()
    this.initializeControllers(controllers)
    // error handlers 中间件放在路由后面, 这样可以在路由中使用 next(err) 来 trigger
    this.initializeErrorHandlers()
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json())
    this.app.use(cookieParser())
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach(controller => {
      this.app.use('/', controller.router)
    })
  }

  private initializeErrorHandlers() {
    this.app.use(errorMiddleware)
  }

  private connectToDB() {
    const { MONGO_PATH } = process.env
    const options = {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
    }
    mongoose.connect(MONGO_PATH, options)
    
    const db = mongoose.connection
    db.on('error', () => {
      console.log('Error when connecting to db')
    })
    db.once('open', () => {
      console.log('Successfully connecting to db')
    })
  }

  public listen(port=Number(process.env.PORT)) {
    this.app.listen(port, () => {
      console.log(`server starts at ${port}`)
    })
  }
}