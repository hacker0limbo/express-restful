import * as express from 'express'
import { Router, Request, Response, NextFunction } from 'express'
import Post from '../interfaces/post.interface'
import PostModel from '../models/post.model'
import Controller from '../interfaces/controller.interface'
import PostNotFoundException from '../exceptions/PostNotFoundException'
import validateMongoID from '../utils/validateMongoID'
import validationMiddleware from '../middleware/validation.middleware'
import PostDto from '../dto/post.dto'
import authMiddleware from '../middleware/auth.middleware'
import UserRequest from '../interfaces/userRequest.interface'

export default class PostController implements Controller {
  public path: string
  public router: Router

  constructor() {
    this.path = '/posts'
    this.router = express.Router()

    this.initializeRoutes()
  }

  private initializeRoutes() {
    // 未登录用户有权进行读操作
    this.router.get(this.path, this.getAllPosts)
    this.router.get(`${this.path}/:id`, this.getPost)

    // all 形成的 chain 只对下面的方法有效, 即写操作需要登录权限
    this.router
      .all(`${this.path}/*`, authMiddleware)
      .post(this.path, validationMiddleware(PostDto), this.newPost)
      .put(`${this.path}/:id`, validationMiddleware(PostDto, true), this.updatePost)
      .delete(`${this.path}/:id`, this.deletePost)
  }

  private getAllPosts(req: Request, res: Response) {
    PostModel.find().populate('author', '-password').then(post => {
      res.json(post)
    })
  }

  @validateMongoID
  private getPost(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id
    PostModel.findById(id).then(post => {
      if (post) {
        // post 的所有完整信息返回给客户端, 包括 post 的作者信息
        post.populate('author', '-password').execPopulate().then(p => {
          res.json(p)
        })
      } else {
        next(new PostNotFoundException(id))
      }
    })
  }

  private newPost(req: UserRequest, res: Response) {
    const postData: Post = req.body
    const post = new PostModel({
      ...postData,
      author: req.user._id
    })
    // 筛选出 post 的 author 对象, 返回给客户端
    post.save().then(post => {
      post.populate('author', '-password').execPopulate().then(p => {
        res.send(p)
      })
    })
  }

  @validateMongoID
  private updatePost(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id
    // 由于传过来的数据并不一定是一个完整的 post, 使用 Partial, 可以使该类型的所有 field 可选
    const postData: Partial<Post> = req.body
    PostModel.findByIdAndUpdate(id, postData, { new: true }).then(post => {
      if (post) {
        post.populate('author', '-password').execPopulate().then(p => {
          res.send(p)
        })  
      } else {
        next(new PostNotFoundException(id))
      }
    })
  }

  @validateMongoID
  private deletePost(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id
    PostModel.findByIdAndDelete(id).then(post => {
      if (post) {
        post.populate('author', '-password').execPopulate().then(p => {
          res.send(p)
        })  
      } else {
        next(new PostNotFoundException(id))
      }
    })
  }
}