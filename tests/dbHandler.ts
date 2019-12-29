import * as mongoose from 'mongoose'

import { MongoMemoryServer } from 'mongodb-memory-server'
import App from '../src/app'
import AuthenticationController from '../src/controllers/authentication.controller'
import PostController from '../src/controllers/post.controller'

const mongod = new MongoMemoryServer()

export const app = new App([
  new PostController(),
  new AuthenticationController(),
])

export const connectDB = async () => {
  const uri = await mongod.getUri()

  app.connectToDB(uri)
}

export const closeDB = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongod.stop()
}

export const clearDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({})
  }
}
