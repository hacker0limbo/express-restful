import App from './app'
import PostController from './controllers/post.controller'
import AuthenticationController from './controllers/authentication.controller'
import UserReportController from './controllers/userReport.controller'
import validateEnv from './utils/validateEnv'
import 'dotenv/config'

validateEnv()

const app = new App([
  new PostController(),
  new AuthenticationController(),
  new UserReportController()
])

app.connectToDB().listen(5000)