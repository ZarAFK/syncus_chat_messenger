import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StatusStorageService {
  private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads', 'status');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveImage(userId: number, base64Str: string): Promise<string> {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Format Base64 tidak valid');
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const extension = matches[1].split('/')[1] || 'jpg';
    const filename = `status_${userId}_${Date.now()}.${extension}`;
    const filepath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filepath, imageBuffer);
    
    return `/uploads/status/${filename}`;
  }

  async saveMultipleImages(userId: number, base64Strings: string[]): Promise<string[]> {
    const paths: string[] = [];
    for (let i = 0; i < base64Strings.length; i++) {
      const base64Str = base64Strings[i];
      const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error(`Format Base64 pada indeks ${i} tidak valid`);
      }

      const imageBuffer = Buffer.from(matches[2], 'base64');
      const extension = matches[1].split('/')[1] || 'jpg';
      const filename = `status_${userId}_${Date.now()}_${i}.${extension}`;
      const filepath = path.join(this.uploadDir, filename);

      fs.writeFileSync(filepath, imageBuffer);
      paths.push(`/uploads/status/${filename}`);
    }
    return paths;
  }

  async deleteImage(imagePath: string | string[]): Promise<void> {
    const pathsToDelete = Array.isArray(imagePath) ? imagePath : [imagePath];
    for (const p of pathsToDelete) {
      if (!p) continue;
      const cleanPath = p.split('?')[0];
      const filepath = path.join(process.cwd(), 'public', cleanPath);
      
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          console.error(`Gagal menghapus file: ${filepath}`, e);
        }
      }
    }
  }
}
