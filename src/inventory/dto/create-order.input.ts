import { InputType, Int, Field } from '@nestjs/graphql';

export class LineProduct {
  @Field({ nullable: true })
  id: string;
}

@InputType()
export class CreateOrderInput {
  @Field({ description: 'shopify entity admin_graphql_api_id' })
  id: string;

  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  shopifyCreatedAt?: string;
  @Field({ nullable: true })
  confirmed?: boolean;
  @Field({ nullable: true })
  cancelledAt?: string;
  @Field({ nullable: true })
  shop?: string;
  @Field({ nullable: true })
  totalPrice?: string;
  @Field({ nullable: true })
  parentId?: string;
  @Field(() => LineProduct)
  product?: LineProduct;
  @Field({ nullable: true })
  price?: string;
}
