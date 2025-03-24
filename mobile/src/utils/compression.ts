// import pako from 'pako';
// import { encode as base64Encode, decode as base64Decode } from 'base64-js';

// export const compressData = (data: string): string => {
//   const stringifiedData = JSON.stringify(data);
//   const compressed = pako.gzip(stringifiedData);
//   return base64Encode(compressed); // Chuyển Uint8Array thành Base64
// };

// export const decompressData = (compressedData: string): any => {
//   try {
//     const byteArray = base64Decode(compressedData); // Chuyển Base64 thành Uint8Array
//     const decompressed = pako.ungzip(byteArray, { to: 'string' });
//     return JSON.parse(decompressed);
//   } catch (error) {
//     console.error("Error decompressing data:", error);
//     return null;
//   }
// };
