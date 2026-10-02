import { bindingState, canSyncAs, canUseLocalData } from '@/features/sync/binding';

describe('pengikatan penyimpanan lokal ke akun', () => {
  it('status ikatan', () => {
    expect(bindingState(null, 'a')).toBe('unbound');
    expect(bindingState(undefined, 'a')).toBe('unbound');
    expect(bindingState('a', 'a')).toBe('same');
    expect(bindingState('a', 'b')).toBe('other');
  });
  it('sinkron ditolak lintas akun', () => {
    expect(canSyncAs(null, 'a')).toBe(true);
    expect(canSyncAs('a', 'a')).toBe(true);
    expect(canSyncAs('a', 'b')).toBe(false);
  });
});


describe('akses data lokal', () => {
  it('ditolak hanya saat sesi akun lain aktif', () => {
    expect(canUseLocalData('a', null)).toBe(true);
    expect(canUseLocalData(null, 'b')).toBe(true);
    expect(canUseLocalData('a', 'a')).toBe(true);
    expect(canUseLocalData('a', 'b')).toBe(false);
  });
});
