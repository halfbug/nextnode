import {
  Post,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Controller,
  Res,
  Get,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '@nestjs/swagger';

import { ImageFileDTO, ImageResponseDTO } from './UploadImageDTO';
import { UploadImageService } from './uploadimage.service';

@Controller('image')
export class UploadImageController {
  constructor(private readonly uploadImageService: UploadImageService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('image', { limits: { files: 1 } }))
  @ApiResponse({ status: HttpStatus.CREATED, type: ImageResponseDTO })
  async upload(
    @Req() req,
    @UploadedFile() file: ImageFileDTO,
    @Res() response,
  ) {
    try {
      const data: ImageResponseDTO = await this.uploadImageService.upload(file);
      const dataDel = await this.uploadImageService.deleteImage(
        req.body.previousimage,
      );

      return response.status(200).json({
        message: `Image ${file.originalname} uploaded to S3`,
        data,
      });
    } catch (error) {
      return response
        .status(500)
        .json(`Failed to upload image to S3: ${error.message}`);
    }
  }

  @Get('')
  @ApiResponse({ status: HttpStatus.CREATED, type: ImageResponseDTO })
  async getImageUrl(@Req() req, @Res() response) {
    // console.log(req.query);
    // response.send(req.query);
    const { key } = req.query;

    try {
      const data = await this.uploadImageService.getSignedUrl(key);
      return response.status(200).json({
        message: `s3 url sent`,
        data,
      });
    } catch (error) {
      return response
        .status(500)
        .json(`Failed to get image from S3: ${error.message}`);
    }
  }
}
