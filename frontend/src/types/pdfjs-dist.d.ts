declare module 'pdfjs-dist' {
  const pdfjsLib: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    getDocument: (data: { data: ArrayBuffer }) => {
      promise: Promise<{
        numPages: number;
        getPage: (num: number) => Promise<{
          getTextContent: () => Promise<{
            items: { str: string }[];
          }>;
        }>;
      }>;
    };
  };
  export default pdfjsLib;
}
