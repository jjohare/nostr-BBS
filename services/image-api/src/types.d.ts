declare module 'cors';
declare module 'multer';
declare module 'uuid' {
  export function v4(): string;
}

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

declare global {
  namespace Express {
    interface Request {
      file?: MulterFile;
      files?: MulterFile[];
    }
    namespace Multer {
      interface File extends MulterFile {}
    }
  }
}

export {};
