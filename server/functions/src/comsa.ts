
import { firstValueFrom } from 'rxjs';
import { AccountInfo, Mosaic, RepositoryFactoryHttp, MosaicId, MetadataType } from 'symbol-sdk';
import { NODE_URL } from './settings';
import fetch from 'node-fetch';

const getComsaThumbnailAsync = async (mosaic: Mosaic) => {
  const id = mosaic.id.toHex();

  if (id === '6BED913FA20223F8' || mosaic.amount.compact() !== 1) return null;
  const node = new RepositoryFactoryHttp(NODE_URL);
  const metaRepo = node.createMetadataRepository();
  
  const meta = await firstValueFrom(metaRepo.search({
    targetId: new MosaicId(id),
    metadataType: MetadataType.Mosaic,
    pageSize: 100
  }))
  const metaMap = new Map<string, string>();
  meta.data.forEach(m => {
    const key = m.metadataEntry.scopedMetadataKey.toHex();
    metaMap.set(key, m.metadataEntry.value);
  })
  if (!metaMap.has('C66A4EBE09577AF6') || !metaMap.has('DA030AA7795EBE75')) return null;
  const comsaHeader = metaMap.get('DA030AA7795EBE75')!;
  const headerJSON = JSON.parse(comsaHeader);
  const thumbnail = metaMap.get('C66A4EBE09577AF6')!;
  const aggTxes = JSON.parse(thumbnail) as string[];

	const dataType = "data:" + headerJSON.mime_type + ";base64,";
  const dataList = await Promise.all(aggTxes.map(async (tx) => {
    // いい感じの型がなかったので生データを扱う
    const response = await fetch(`${NODE_URL}/transactions/confirmed/${tx}`)
    const json = await response.json() as any;
    const transactions = json.transaction.transactions as any[];
    let message = '';
    for (let i = 1; i < transactions.length; i++) {
      const hexMessage = transactions[i].transaction.message;
      message += Buffer.from(hexMessage, 'hex').toString('utf-8').substring(7);
    }
    return message;
  }));
  return dataType + dataList.join('');
}

export const getComsaThumbnailListAsync = async (accountInfo: AccountInfo) => {
  const imageList = await Promise.all( accountInfo.mosaics.map(mosaic => {
    return getComsaThumbnailAsync(mosaic);
  }));
  return imageList.filter(v => v);
}