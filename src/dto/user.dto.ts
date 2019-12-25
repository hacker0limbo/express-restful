import { IsString, IsEmail, ValidateNested, IsOptional } from 'class-validator'
import BaseDto from './base.dto'
import AddressDto from './address.dto'

export default class UserDto extends BaseDto {

  @IsString()
  public name: string  

  @IsEmail()
  public email: string

  @IsString()
  public password: string

  @IsOptional()
  @ValidateNested()
  public address?: AddressDto
}