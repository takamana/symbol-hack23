import { auth } from 'firebase-admin';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import * as functions from "firebase-functions/v1";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firstValueFrom } from 'rxjs';
import { Account, TransferTransaction, Address, RepositoryFactoryHttp, Deadline, NetworkType, PublicAccount, TransactionGroup } from 'symbol-sdk';
import { NODE_URL } from './settings';
import { getComsaThumbnailListAsync } from './comsa';

initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

const getCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

const getMessage = (code: string) => {
  return `SymbolHack23 認証コード: ${code}`;
}

export const sendMessage = functions
  .region('asia-northeast1')
  .runWith({secrets: ['SERVER_KEY_MAIN'], })
  .https.onCall(async (data: { address: string }) => {
    try {
      const { address } = data;

      const serverKey = process.env.SERVER_KEY_MAIN!
      const serverHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
      const networkType = NetworkType.MAIN_NET;

      const serverAccount = Account.createFromPrivateKey(serverKey, networkType);
      const node = new RepositoryFactoryHttp(NODE_URL);
      const txRepo = node.createTransactionRepository();

      // 公開鍵取得
      const rawAddress = Address.createFromRawAddress(address);
      const accountRepo = node.createAccountRepository();
      const accountInfo = await firstValueFrom(accountRepo.getAccountInfo(rawAddress));

      const code = getCode();

      // 送信
      const userAddress = PublicAccount.createFromPublicKey(accountInfo.publicKey, networkType);
      const encryptMessageStr = serverAccount.encryptMessage(getMessage(code), userAddress);
      const epochAdjustment = await firstValueFrom(node.getEpochAdjustment());
      
      const tx = TransferTransaction.create(
        Deadline.create(epochAdjustment!, 2),
        Address.createFromPublicKey(userAddress.publicKey, networkType), 
        [],
        encryptMessageStr, //メッセージ
        networkType // メインネット区分
      ).setMaxFee(101); //最大手数料

      const signedTx = serverAccount.sign(tx, serverHash);

      // 送信コード記録
      const authenticationCodeRef = db.collection('authenticationCode');
      const doc = authenticationCodeRef.doc();
      const saveData = {
        id: doc.id,
        code,
        address,
        hash: signedTx.hash,
        createdAt: Timestamp.now(),
        expiredAt: Timestamp.fromMillis(Timestamp.now().toMillis() + 1000 * 60 * 10) // 10分制限
      };
      const saveTask = doc.create(saveData);

      await Promise.all([firstValueFrom(txRepo.announce(signedTx)), saveTask]);

      // 適当に待つ
      let count = 12;
      while (count-- > 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const transactionResult = await firstValueFrom(txRepo.getTransaction(signedTx.hash, TransactionGroup.Unconfirmed));
          if (transactionResult) {
            console.log('Unconfirmed')
            break;
          }
        } catch (e) {
          console.warn(e);
        }
      }

      return count >= 0;
    } catch (e) {
      console.error(e);
      return false;
    }
  });

  export const checkCode = functions
    .region('asia-northeast1')
    .https.onCall(async (data: { address: string, code: string }) => {
      const failureResult = { result: false };
      try {
        const { address, code } = data;
        if (!address || !code) return failureResult

        // コード存在チェック
        // firestoreでインデックスの登録が必要
        const snap = await db.collection('authenticationCode')
          .where('address','==', address)
          .where('code', '==', code)
          .where('expiredAt', '>=', Timestamp.now())
          .limit(1)
          .get();

        if (snap.empty) return failureResult;

        // カスタムトークン作成
        const customToken = await auth().createCustomToken(address, { rawAddress: address });
        return {
          result: true,
          customToken
        }

      } catch (e) {
        console.error(e);
        return failureResult
      }
  });

export const getThumbnailList = functions
.region('asia-northeast1')
.runWith({
  memory: '1GB'
})
.https.onCall(async (_, context) => {
  const auth = context.auth;
  if (!auth) {
    console.log('not auth');
    return [];
  }
  try {
    const address = auth.token.rawAddress;
    const node = new RepositoryFactoryHttp(NODE_URL);
    const accountRepo = node.createAccountRepository();
    const rawAddress = Address.createFromRawAddress(address);
    const accountInfo = await firstValueFrom(accountRepo.getAccountInfo(rawAddress));
    return getComsaThumbnailListAsync(accountInfo);
  } catch (e) {
    console.error(e);
    return [];
  }
});