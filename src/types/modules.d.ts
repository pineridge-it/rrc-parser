// Type declarations for modules without type definitions

declare module 'shpjs' {
  import { FeatureCollection } from 'geojson';

  function shp(data: ArrayBuffer | Buffer): Promise<FeatureCollection | FeatureCollection[]>;
  namespace shp {
    function parseShp(data: ArrayBuffer | Buffer): Promise<FeatureCollection | FeatureCollection[]>;
  }
  export = shp;
}

declare module '@tmcw/togeojson' {
  import { FeatureCollection } from 'geojson';

  export function kml(doc: Document): FeatureCollection;
}

declare module 'xmldom' {
  export class DOMParser {
    constructor(options?: { errorHandler?: { warning?: (msg: string) => void; error?: (msg: string) => void; fatalError?: (msg: string) => void } });
    parseFromString(xml: string, mimeType: string): Document;
  }

  export class XMLSerializer {
    serializeToString(node: Node): string;
  }
}

// Next.js server types (stub for backend compatibility)
declare module 'next/server' {
  export interface NextRequest extends Request {
    nextUrl: URL;
    ip?: string;
    geo?: {
      city?: string;
      country?: string;
      region?: string;
    };
    headers: Headers;
  }

  export class NextResponse extends Response {
    static json<T>(data: T, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      set(name: string, value: string, options?: { maxAge?: number; expires?: Date; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }): void;
      delete(name: string): void;
    };
  }
}
