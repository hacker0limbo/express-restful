import AuthenticationService from '../src/authentication/authentication.service'
import User from '../src/interfaces/user.interface'
import { connectDB, closeDB, clearDB } from './dbHandler'
import UserModel from '../src/models/user.model'
import UserDto from '../src/dto/user.dto'
import DuplicateEmailException from '../src/exceptions/DuplicateEmailException'

beforeAll(async () => {
  await connectDB()
})

beforeEach(async () => {
  const user: User = await UserModel.create({
    name: 'testname',
    email: 'test@email.com',
    password: 'testpwd'
  })
})

afterEach(async () => {
  await clearDB()
})

afterAll(async () => {
  await closeDB()
})

const authenticationService = new AuthenticationService()

describe('test createToken()', () => {

  // 测试 createToken() 方法
  it('token is created and format is valid', async () => {
    const user = await UserModel.findOne({ name: 'testname' })
    expect(authenticationService.createToken(user).token.split('.')).toHaveLength(3)
    expect(typeof authenticationService.createToken(user).token).toBe('string')
    expect(typeof authenticationService.createToken(user).expiresIn).toBe('number')
  })
})

describe('test register()', () => {
  // 测试 register() 方法
  it('valid register should return user with hashed password', async () => {
    const validUserData: UserDto = {
      name: 'test',
      email: 'test123@test.com',
      password: 'testtest'
    }
    try {
      const { user } = await authenticationService.register(validUserData)
      await expect(UserModel.find({})).resolves.toHaveLength(2)
      await expect(UserModel.findOne({ name: 'test' })).resolves.not.toHaveProperty('password', validUserData.password)
      expect(user.name).toBe(validUserData.name)
      expect(user.email).toBe(validUserData.email)
      expect(user.password).toBeUndefined()
    } catch (error) {
      console.log(error)
      fail(new Error('should not throw error since user data is valid'))
    }
  })

  it('invalid register should throw error', async () => {
    const duplicateUserData: UserDto = {
      name: 'test',
      email: 'test@email.com',
      password: 'testtest'
    }
    // 异步测试暂时不支持 expect(async () => await fn()) 这种形式
    await expect(authenticationService.register(duplicateUserData)).rejects.toThrow(DuplicateEmailException)
    await expect(UserModel.find({})).resolves.toHaveLength(1)
  })
})

