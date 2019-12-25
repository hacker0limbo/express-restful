import { IsString } from 'class-validator'
import BaseDto from './base.dto'

// 客户端发送过来的 post 类型的数据格式, 注意 authorId 等不应该被检查, 只检查客户端发送过来的数据
export default class PostDto extends BaseDto {

  @IsString()
  public content: string

  @IsString()
  public title: string

}