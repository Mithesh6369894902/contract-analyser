declare module 'mammoth' {
  interface Result {
    value: string;
    messages: string[];
  }
  
  interface Options {
    arrayBuffer?: ArrayBuffer;
  }

  export function extractRawText(options: { buffer: ArrayBuffer }): Promise<Result>;
  export function extractRawText(options: { path: string }): Promise<Result>;
}
