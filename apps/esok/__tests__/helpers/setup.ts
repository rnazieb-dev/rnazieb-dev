import { randomBytes as nodeRandom } from 'node:crypto';
import { setRandomSource } from '@/lib/random';

setRandomSource((n) => new Uint8Array(nodeRandom(n)));
