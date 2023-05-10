import { ObjectType, Field, Int } from '@nestjs/graphql';
import { AdminUser } from 'src/admin-users/entities/admin-user.entity';

@ObjectType('collections')
export class collections {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  shopifyId?: string;

  @Field({ nullable: true })
  type?: string;
}

@ObjectType('discoveryTool')
export class discoveryTool {
  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true })
  brandName?: string;
}
@ObjectType('fieldDetail')
export class fieldDetail {
  @Field({ nullable: true })
  parentTitle?: string;

  @Field({ nullable: true })
  fieldname?: string;

  @Field({ nullable: true })
  oldvalue?: string;

  @Field({ nullable: true })
  newValue?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field({ nullable: true })
  sortOrder?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  orderId?: string;

  @Field({ nullable: true })
  brandName?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => [collections], { nullable: true })
  collections?: collections[];

  @Field(() => [discoveryTool], { nullable: true })
  discoveryTool?: discoveryTool[];

  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true })
  rewardTitle?: string;

  @Field({ nullable: true })
  rewardValue?: string;
}
@ObjectType()
export class AdminActivityLog {
  @Field()
  id?: string;

  @Field()
  operation?: string;

  @Field()
  route?: string;

  @Field()
  context?: string;

  @Field({ nullable: true })
  storeId?: string;

  @Field()
  userId?: string;

  @Field(() => AdminUser)
  user?: AdminUser;

  @Field(() => [fieldDetail])
  changes?: fieldDetail[];

  @Field({ defaultValue: new Date() })
  createdAt: Date;

  @Field({ defaultValue: new Date() })
  updatedAt?: Date;
}
