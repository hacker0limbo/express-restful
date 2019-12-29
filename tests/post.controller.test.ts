import { app } from './dbHandler'
import AuthenticationController from '../src/controllers/authentication.controller'
import * as request from 'supertest'
import * as bcrypt from 'bcrypt'
import { connectDB, closeDB, clearDB } from './dbHandler'
import User from '../src/interfaces/user.interface'
import UserModel from '../src/models/user.model'
import PostController from '../src/controllers/post.controller'
import Post from '../src/interfaces/post.interface'
import PostModel from '../src/models/post.model'
import MissingAuthenticationTokenException from '../src/exceptions/MissingAuthenticationTokenException'
import PostNotFoundException from '../src/exceptions/PostNotFoundException'

const authenticationController = new AuthenticationController()
const postController = new PostController()
const agent = request(app.getServer())
const initUser = {
  name: 'testname',
  email: 'test@email.com',
  password: 'testpwd'
}
const initPosts = [
  {
    content: 'test content1',
    title: 'test title1'
  }, {
    content: 'test content2',
    title: 'test title2'
  }
]

const mockLoginBeforeEach = (callback: Function) => {
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
        const token: string = res.header['set-cookie'][0].split(';')[0].split('=')[1]
        callback(token)
        return done()
      })
  })   
}

beforeAll(async () => {
  await connectDB()
})

beforeEach(async () => {
  const user: User = await UserModel.create({
    ...initUser,
    password: bcrypt.hashSync(initUser.password, 10)
  })

  const posts: Post[] = await PostModel.create(initPosts)
})

afterEach(async () => {
  await clearDB() 
})

afterAll(async () => {
  await closeDB()
})

describe('test getAllPosts()', () => {
  it('should get all posts without login', done => {
    agent.get(`${postController.path}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        const posts = JSON.parse(res.text)
        expect(posts).toHaveLength(2)
        expect(posts).toEqual([
          expect.objectContaining({ ...initPosts[0] }),
          expect.objectContaining({ ...initPosts[1] })
        ])
        return done()
      })
  })
})

describe('test getPost()', () => {
  it('should get single post without login', done => {
    PostModel.findOne({ title: initPosts[0].title }).then(p => {
      agent.get(`${postController.path}/${p.id}`)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          const post = JSON.parse(res.text)
          expect(post).toMatchObject({
            ...initPosts[0]
          })
          return done()
        })
    })
  })

  it('invalid post id should trigger PostNotFoundException', done => {
    PostModel.findOne({ title: initPosts[0].title }).then(p => {
      agent.get(`${postController.path}/notfound`)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          const e = new PostNotFoundException('notfound')
          expect(JSON.parse(res.text)).toMatchObject({
            status: e.status,
            message: e.message
          })
          return done()
        })
    })
  })

})

describe('test newPost()', () => {
  let token: string
  mockLoginBeforeEach((t: string) => {
    token = t
  })

  it('inivaid new post without token should trigger MissingAuthenticationTokenException', done => {
    const newPost = {
      title: 't',
      content: 'c'
    }
    agent.post(`/posts/`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(newPost))
      .expect(401)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        const e = new MissingAuthenticationTokenException()
        expect(JSON.parse(res.text)).toMatchObject({
          status: e.status,
          message: e.message
        })
        expect(PostModel.find({})).resolves.toHaveLength(2)
        return done()
      })
  })

  it('invalid new post with missing filed should trigger exception', done => {
    const newPost = {
      title: 't',
    }
    agent.post(`/posts/`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send(JSON.stringify(newPost))
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(JSON.parse(res.text)).toMatchObject({ status: 400 })
        expect(JSON.parse(res.text)).toHaveProperty('message')
        expect(PostModel.find({})).resolves.toHaveLength(2)
        return done()
      })
  })

  it('valid new post should add post to db', done => {
    const newPost = {
      title: 'new title',
      content: 'new content',
    }
    agent.post(`/posts/`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send(JSON.stringify(newPost))
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        const p = JSON.parse(res.text)
        expect(p).toMatchObject({
          ...newPost,
        })
        expect(p).toHaveProperty('author')
        expect(p).not.toHaveProperty('password')
        expect(PostModel.find({})).resolves.toHaveLength(3)

        return done()
      })
  })
})

describe('test updatePost()', () => {
  let token: string
  mockLoginBeforeEach((t: string) => {
    token = t
  })

  it('invalid update post without token should trigger MissingAuthenticationTokenException', done => {
    const p = {
      content: 'update'
    }
    PostModel.findOne({ title: initPosts[0].title }).then(p => {
      agent.put(`/posts/${p.id}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(p))
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          const e = new MissingAuthenticationTokenException()
          expect(JSON.parse(res.text)).toMatchObject({
            status: e.status,
            message: e.message
          })
          expect(PostModel.find({})).resolves.toHaveLength(2)
          return done()
        })
      })
  })

  it('valid update post should modify original post', done => {
    PostModel.findOne({ title: initPosts[0].title }).then(p => {
      const data = {
        content: 'update content',
      }
      agent.put(`/posts/${p.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send(JSON.stringify(data))
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          const p = JSON.parse(res.text)
          expect(p).toMatchObject({
            ...initPosts[0],
            ...data
          })
          expect(PostModel.find({})).resolves.toHaveLength(2)
  
          return done()
        })
  
    })
  })
})

describe('test deletePost()', () => {
  let token: string
  mockLoginBeforeEach((t: string) => {
    token = t
  })
  it('invalid delete post without token should trigger MissingAuthenticationTokenException', done => {
    PostModel.findOne({ title: initPosts[0].title }).then(p => {
      agent.delete(`/posts/${p.id}`)
      .expect(401)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        const e = new MissingAuthenticationTokenException()
        expect(JSON.parse(res.text)).toMatchObject({
          status: e.status,
          message: e.message
        })
        expect(PostModel.find({})).resolves.toHaveLength(2)
        return done()
      })
    })
  })

  it('valid delete post should remove corresponged post', done => {
    PostModel.findOne({ title: initPosts[0].title }).then(p => {
      agent.delete(`/posts/${p.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          const p = JSON.parse(res.text)
          expect(p).toMatchObject({
            ...initPosts[0],
          })
          expect(PostModel.find({})).resolves.toHaveLength(1)
  
          return done()
        })
    })
  })
})
