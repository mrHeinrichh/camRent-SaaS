import type { Express } from 'express';
import streamifier from 'streamifier';
import { cloudinary } from '../config/cloudinary';

export async function uploadToCloudinary(file: Express.Multer.File, folder: string) {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
      if (error || !result) return reject(error || new Error('Upload failed'));
      resolve(result.secure_url);
    });

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
}
