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
}
