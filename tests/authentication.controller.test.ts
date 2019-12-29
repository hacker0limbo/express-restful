import { app } from './dbHandler'
import AuthenticationController from '../src/controllers/authentication.controller'
import * as request from 'supertest'
import * as bcrypt from 'bcrypt'
import { connectDB, closeDB, clearDB } from './dbHandler'
import User from '../src/interfaces/user.interface'
import UserModel from '../src/models/user.model'
import DuplicateEmailException from '../src/exceptions/DuplicateEmailException'
import InvalidCredentialsException from '../src/exceptions/InvalidCredentialsException'

const authenticationController = new AuthenticationController()
const agent = request(app.getServer())
const initUser = {
  name: 'testname',
  email: 'test@email.com',
  password: 'testpwd'
}

beforeAll(async () => {
  await connectDB()
})

beforeEach(async () => {
  const user: User = await UserModel.create({
    ...initUser,
    password: bcrypt.hashSync(initUser.password, 10)
  })
})

afterEach(async () => {
  await clearDB()
})

afterAll(async () => {
  await closeDB()
})

describe('test register()', () => {
  it('valid register should return user info and store user in db', (done) => {
    const user = {
      name: 'tttt',
      email: 'ttt@email.com',
      password: 'tttttt'
    }
    agent.post(`${authenticationController.path}/register`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(user))
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        
        expect(JSON.parse(res.text)).toHaveProperty('_id')
        expect(JSON.parse(res.text)).toMatchObject({
          name: user.name,
          email: user.email
        })
        expect(JSON.parse(res.text)).not.toHaveProperty('password')
        expect(UserModel.find({})).resolves.toHaveLength(2)
        return done()
      })
  })

  it('invalid register with duplicate emails should trigger DuplicateEmailException', done => {
    const user = {
      name: 'tttt',
      email: initUser.email,
      password: 'tttttt'
    }
    agent.post(`${authenticationController.path}/register`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(user))
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(JSON.parse(res.text)).toMatchObject({
          status: 400,
          message: new DuplicateEmailException(user.email).message
        })
        expect(UserModel.find({})).resolves.toHaveLength(1)
        return done()
      })
  })

  it('invalid register with invalid credentials shoud return 400', done => {
    const user = {
      name: 't',
      password: 'tttttt'
    }
    agent.post(`${authenticationController.path}/register`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(user))
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(JSON.parse(res.text)).toHaveProperty('status', 400)
        expect(JSON.parse(res.text)).toHaveProperty('message')
        expect(UserModel.find({})).resolves.toHaveLength(1)
        return done()
      })
  })
})

describe('test login()', () => {
  it('valid login should return user info and set cookie', done => {
    const user = {
      email: initUser.email,
      password: initUser.password,
    }
    agent.post(`${authenticationController.path}/login`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(user))
      .expect(200)
      .expect('Set-Cookie', /^authorization=.+/)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        // console.log(res.header['set-cookie'][0].split(';')[0].split('=')[1])
        expect(JSON.parse(res.text)).toHaveProperty('_id')
        expect(JSON.parse(res.text)).toMatchObject({
          name: initUser.name,
          email: initUser.email
        })
        expect(JSON.parse(res.text)).not.toHaveProperty('password')
        expect(UserModel.find({})).resolves.toHaveLength(1)  
        return done()
      })
  })

  it('invalid login with unregistered or invalid user email should trigger InvalidCredentialsException', done => {
    const user = {
      email: 'notregistered@email.com',
      password: 'notregistered',
    }

    agent.post(`${authenticationController.path}/login`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(user))
      .expect(401)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        const e = new InvalidCredentialsException()
        expect(JSON.parse(res.text)).toMatchObject({
          status: e.status,
          message: e.message
        })
        return done()
      })
    
  })

  it('invalid login with correct email but wrong password should trigger InvalidCredentialsException', done => {

    const user = {
      email: initUser.email,
      password: 'wrongpassword',
    }

    agent.post(`${authenticationController.path}/login`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(user))
      .expect(401)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        const e = new InvalidCredentialsException()
        expect(JSON.parse(res.text)).toMatchObject({
          status: e.status,
          message: e.message
        })
        return done()
      })
  })
})

describe('test logout()', () => {
  // 存取 cookie
  let cookie: string
  beforeEach(done => {
    // 登录
    const user = {
      email: initUser.email,
      password: initUser.password,
    }
    agent.post(`${authenticationController.path}/login`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(user))
      .expect(200)
      .expect('Set-Cookie', /^authorization=.+/)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        cookie = res.header['set-cookie'][0].split(';')[0].split('=')[1]
        return done()
      })
  })

  it('loggout should clear cookies', done => {
    agent.post(`${authenticationController.path}/logout`)
      .set('Content-Type', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        cookie = res.header['set-cookie'][0].split(';')[0].split('=')[1]
        expect(res.header['set-cookie'][0]).toMatch('authorization=')
        expect(cookie).toBe('')
        return done()
      })
  })
})