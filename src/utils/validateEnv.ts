import { cleanEnv, str } from 'envalid'

const validateEnv = () => {
  cleanEnv(process.env, {
    MONGO_PATH: str()
  })
}

export default validateEnv