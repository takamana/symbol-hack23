import { getApp } from 'firebase/app'
import { getFunctions, httpsCallable} from 'firebase/functions'


export const sendMessage = async (address: string) => {
  const func = getFunctions(getApp(), 'asia-northeast1');
  const request = httpsCallable<{address: string}, boolean>(func, 'sendMessage');
  const response = await request({ address });
  return response.data;
}

export const checkCode = async (address: string, code: string) => {
  const func = getFunctions(getApp(), 'asia-northeast1');
  const request = httpsCallable<{address: string, code: string}, {result: boolean, customToken?: string}>(func, 'checkCode');
  const response = await request({ address, code });
  return response.data;
}

export const getThumbnailList = async () => {
  const func = getFunctions(getApp(), 'asia-northeast1');
  const request = httpsCallable<undefined, string[]>(func, 'getThumbnailList');
  const response = await request();
  console.log(response.data);
  return response.data as string[];
}