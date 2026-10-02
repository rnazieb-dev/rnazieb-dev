import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Db } from '@/db/types';
import { buildExport } from './bundle';

export async function shareExport(db: Db, dek: Uint8Array | null): Promise<void> {
  const bundle = await buildExport(db, dek);
  const file = new File(Paths.cache, `esok-ekspor-${bundle.exportedAt.slice(0, 10)}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(bundle, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Ekspor data NAFS' });
}
