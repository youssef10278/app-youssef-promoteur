import type { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

declare global {
  // Augmente le type de Request pour TypeScript
  namespace Express {
    interface Request {
      file?: UploadedFile;
      files?: UploadedFile[];
      body: any;
    }
  }
}

export function parseMultipart(maxFileSizeBytes = 20 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      // Laissez les autres middlewares gérer (JSON, etc.)
      return next();
    }

    console.log('🔧 Busboy: Parsing multipart data...');

    const bb = Busboy({ 
      headers: req.headers, 
      limits: { 
        fileSize: maxFileSizeBytes, 
        files: 1 
      } 
    });

    const files: UploadedFile[] = [];
    const fields: Record<string, any> = {};
    let fileRejected = false;

    bb.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      console.log('📁 Busboy: Fichier détecté:', { fieldname, filename, encoding, mimeType });

      const chunks: Buffer[] = [];
      let total = 0;

      file.on('data', (data: Buffer) => {
        total += data.length;
        chunks.push(data);
      });

      file.on('limit', () => {
        console.error('❌ Busboy: Fichier trop volumineux');
        fileRejected = true;
        file.resume(); // vider le stream
      });

      file.on('end', () => {
        if (fileRejected) return;
        const buffer = Buffer.concat(chunks);
        console.log('✅ Busboy: Fichier lu, taille:', buffer.length);
        files.push({
          fieldname,
          originalname: filename,
          encoding,
          mimetype: mimeType,
          buffer,
          size: buffer.length,
        });
      });
    });

    bb.on('field', (name, val) => {
      console.log('📝 Busboy: Champ détecté:', { name, val });
      fields[name] = val;
    });

    bb.on('error', (err) => {
      console.error('❌ Busboy: Erreur:', err);
      next(err);
    });

    bb.on('finish', () => {
      console.log('🎯 Busboy: Parsing terminé, fichiers:', files.length, 'champs:', Object.keys(fields));
      req.body = { ...req.body, ...fields };

      // Convention: on prend le premier fichier si présent
      if (files.length > 0) {
        req.file = files[0];
        req.files = files;
      }
      return next();
    });

    req.pipe(bb);
  };
}
