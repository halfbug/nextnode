import { InputType, Field } from '@nestjs/graphql';
import { CreateGroupshopInput } from 'src/groupshops/dto/create-groupshops.input';

@InputType()
export class IReward {
  @Field({ nullable: true })
  commission: string;
  @Field({ nullable: true })
  baseline: string;
  @Field({ nullable: true })
  average: string;
  @Field({ nullable: true })
  maximum: string;
}

@InputType()
export class CreateChannelInput {
  @Field({ nullable: true })
  storeId: string;
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  slugName: string;
  @Field({ nullable: true })
  rewards: IReward;
  @Field({ nullable: true })
  isActive?: boolean;
  @Field({ defaultValue: new Date() })
  createdAt: Date;
  @Field({ defaultValue: new Date() })
  updatedAt?: Date;

  // @Field(() => [CreateGroupshopInput], { nullable: 'itemsAndList' })
  // channelGroupshops?: [CreateGroupshopInput];

  // @Field({ defaultValue: 'Active', nullable: true })
  // status: string;
}

@InputType()
export class GetChannelByName {
  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  storeId: string;
}
