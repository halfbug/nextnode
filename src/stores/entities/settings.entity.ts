import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Settings {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  brandColor?: string;

  @Field({ nullable: true })
  customColor?: string;

  @Field({ nullable: true })
  customBg?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  youtubeUrl?: string;

  @Field({ nullable: true })
  media?: string;
}
