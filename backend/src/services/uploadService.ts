import type { Express } from 'express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import streamifier from 'streamifier';
import { cloudinary } from '../config/cloudinary';

export async function uploadToCloudinary(file: Express.Multer.File, folder: string) {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
      if (error || !result) return reject(error || new Error('Upload failed'));
      resolve(result.secure_url);
    });

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
}

export async function uploadToLocal(file: Express.Multer.File, folder: string) {
  const normalizedFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/+/g, '/');
  const baseDir = path.resolve(process.cwd(), 'backend', 'uploads', normalizedFolder);
  await mkdir(baseDir, { recursive: true });

  const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const destination = path.join(baseDir, fileName);
  await writeFile(destination, file.buffer);

  const relativePath = path.posix.join('uploads', normalizedFolder, fileName);
  return `/${relativePath}`;
}
