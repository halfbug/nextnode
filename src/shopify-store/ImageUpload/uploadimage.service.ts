import { Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { S3ConfigProvider } from './S3ConfigProvider';

export class UploadImageService {
  private readonly s3Provider: S3ConfigProvider;

  constructor() {
    this.s3Provider = new S3ConfigProvider();
  }

  async upload(file) {
    const { originalname } = file;
    const S3bucket = this.s3Provider.getBucketName();
    return await this.uploadS3(file.buffer, S3bucket, originalname);
  }

  async uploadS3(file, bucket, name) {
    const s3 = this.s3Provider.getS3();
    const s3Params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
    };

    const data = await this.uploadImageToS3(s3, s3Params);
    return data;
  }

  async uploadImageToS3(s3: S3, s3Params) {
    return new Promise((resolve, reject) => {
      s3.upload(s3Params, (err, data) => {
        if (err) {
          Logger.error(err);
          reject(err);
        }
        resolve(data);
      });
    });
  }
  async getSignedUrl(key: string) {
    const S3 = this.s3Provider.getS3();
    const S3bucket = this.s3Provider.getBucketName();
    const params = { Bucket: S3bucket, Key: key };
    // console.log(S3Obj);
    const SignedUrl = await S3.getSignedUrl('getObject', params);
    console.log(
      '🚀 ~ file: uploadimage.service.ts ~ line 47 ~ UploadImageService ~ getSignedUrl ~ SignedUrl',
      SignedUrl,
    );
    return SignedUrl;

    // return await this.uploadS3(file.buffer, S3bucket, originalname);
  }
}
