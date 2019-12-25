import { IsString } from 'class-validator'
import BaseDto from './base.dto'

export default class LoginDto extends BaseDto {
  @IsString()
  public email: string

  @IsString()
  public password: string
}
