import { DealProductsInput } from './create-groupshops.input';
import {
  InputType,
  ObjectType,
  Field,
  Int,
  PartialType,
} from '@nestjs/graphql';

@InputType('QRInput')
@ObjectType('QRInputType')
export class QRInput {
  @Field(() => String)
  url: string;
  @Field(() => String)
  brandname: string;
}
