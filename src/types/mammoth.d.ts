declare module 'mammoth' {
  export interface RawTextResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface Options {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<RawTextResult>;
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
}
