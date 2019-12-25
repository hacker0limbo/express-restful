import { RequestHandler, Request, Response, NextFunction } from 'express'
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer'
import BaseDto from '../dto/base.dto';
import HttpException from '../exceptions/HttpException';

/**
 * 验证客户端发送的数据的可靠性
 * @param Dto 客户端发送的数据
 * @param skipMissingProperties 是否跳过未发送的数据
 */
const validationMiddleware = (Dto: { new(): BaseDto }, skipMissingProperties=false): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // post 需要检查所有字段, patch/put 由于更新局部, 仅需检查部分存在的字段
    validate(plainToClass(Dto, req.body), { skipMissingProperties }).then(errors => {
      if (errors.length > 0) {
        const errorMessage = errors.map(error => {
          return Object.values(error.constraints)
        }).join(', ')

        // 400 代表 bad request, 发送的数据有问题
        next(new HttpException(400, errorMessage))
      } else {
        next()
      }
    })
  }
}

export default validationMiddleware