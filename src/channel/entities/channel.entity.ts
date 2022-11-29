import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GroupShop } from 'src/groupshops/entities/groupshop.entity';

@ObjectType()
export class IRewards {
  // @Column({ nullable: true })
  // activatedAt: Date;
  @Field({ nullable: true })
  commission: string;
  @Field({ nullable: true })
  baseline: string;
  @Field({ nullable: true })
  average: string;
  @Field({ nullable: true })
  maximum: string;
}

@ObjectType()
export class Channel {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  storeId: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  slugName: string;

  @Field({ nullable: true })
  rewards: IRewards;

  @Field({ nullable: true })
  isActive?: boolean;

  // @Field({ defaultValue: 'Active', nullable: true })
  // status: string;
}
