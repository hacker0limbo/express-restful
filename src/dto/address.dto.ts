import { IsString } from 'class-validator'

export default class AddressDto {
  @IsString()
  public street: string  

  @IsString()
  public city: string

}
