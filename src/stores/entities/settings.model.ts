import { Column } from 'typeorm';
export class Settings {
  @Column({ nullable: true })
  brandColor: string;

  @Column()
  customColor: string;

  @Column()
  customBg: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  youtubeUrl: string;

  @Column({ nullable: true })
  media: string;
  constructor(
    brandColor: string,
    customColor: string,
    customBg: string,
    imageUrl: string,
    youtubeUrl: string,
    media: string,
  ) {
    this.brandColor = brandColor;
    this.customColor = customColor;
    this.customBg = customBg;
    this.imageUrl = imageUrl;
    this.youtubeUrl = youtubeUrl;
    this.media = media;
  }
}
