import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Chip, Empty, Pill, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { countLedger, deleteLedgerItem, listLedger, settleLedgerItem } from '@/features/ledger/repo';
import { formatMoney } from '@/features/support/money';
import { useCurrency } from '@/features/support/useRegion';
import { type LedgerType } from '@/features/ledger/types';
import { daysBetween, formatDayLong } from '@/lib/dates';
import { useT } from '@/i18n/useT';
import { useApp, useDbQuery } from '@/state/app';

const FILTERS: (LedgerType | 'semua')[] = ['semua', 'utang', 'piutang', 'amanah', 'wasiat'];

type T = ReturnType<typeof useT>['t'];

function dueText(t: T, due: string | null, today: string): string | null {
  if (!due) return null;
  const d = daysBetween(today, due);
  if (d < 0) return t('journal.ledger.overdue', { n: -d, date: formatDayLong(due) });
  if (d === 0) return t('journal.ledger.dueToday');
  return t('journal.ledger.dueOn', { date: formatDayLong(due), n: d });
}

export default function LedgerScreen() {
  const router = useRouter();
  const { t, lang } = useT();
  const currency = useCurrency();
  const { db, today, dek, unlockVault, bump, reschedule } = useApp();
  const [filter, setFilter] = useState<LedgerType | 'semua'>('semua');
  const items = useDbQuery((d) => (dek ? listLedger(d, dek) : Promise.resolve([])), [dek], []);
  const counts = useDbQuery((d) => countLedger(d), [], { total: 0, open: 0 });
  const shown = items.data.filter((x) => filter === 'semua' || x.type === filter);

  const remove = (id: string) =>
    Alert.alert(t('journal.ledger.deleteTitle'), t('journal.ledger.deleteBody'), [
      { text: t('journal.common.cancel'), style: 'cancel' },
      { text: t('journal.common.delete'), style: 'destructive', onPress: async () => { await deleteLedgerItem(db, id); bump(); void reschedule(); } },
    ]);

  return (
    <Screen>
      <ScreenGuard active={!!dek} id="ledger" />
      <Text variant="title">{t('journal.ledger.title')}</Text>
      <Card tone="accent">
        <Text>{t('journal.ledger.hadithDebt')}</Text>
        <Text>{t('journal.ledger.hadithWill')}</Text>
      </Card>
      <Text muted>{t('journal.ledger.privacy')}</Text>

      {!dek ? (
        <Card tone="secret">
          <Text>{t('journal.ledger.lockedCount', { total: counts.data.total, open: counts.data.open })}</Text>
          <Button title={t('journal.common.open')} onPress={() => unlockVault()} />
        </Card>
      ) : (
        <>
          <Button title={t('journal.ledger.add')} onPress={() => router.push({ pathname: '/ledger/[id]', params: { id: 'new' } })} />
          <Row>
            {FILTERS.map((f) => <Chip key={f} label={f === 'semua' ? t('journal.ledger.all') : t(`journal.ledger.types.${f}`)} selected={filter === f} onPress={() => setFilter(f)} />)}
          </Row>
          {shown.length === 0 ? <Empty title={t('journal.ledger.emptyTitle')} body={t('journal.ledger.emptyBody')} /> : null}
          {shown.map((x) => {
            const due = x.settled ? null : dueText(t, x.dueDay, today);
            const overdue = !x.settled && x.dueDay !== null && x.dueDay < today;
            return (
              <Card key={x.id} tone={x.type === 'wasiat' ? 'secret' : undefined}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text variant="heading" style={{ flex: 1 }}>{x.title}</Text>
                  <Pill label={x.settled ? t('journal.ledger.settled') : t(`journal.ledger.types.${x.type}`)} tone={x.settled ? 'muted' : 'accent'} />
                </Row>
                {x.counterparty ? <Text muted>{x.type === 'piutang' ? t('journal.ledger.to') : x.type === 'wasiat' ? t('journal.ledger.for') : t('journal.ledger.with')}: {x.counterparty}</Text> : null}
                {x.amountIdr !== null ? <Text variant="heading">{formatMoney(x.amountIdr, currency.code, lang)}</Text> : null}
                {x.note ? <Text>{x.note}</Text> : null}
                {due ? <Text color={overdue ? '#B3402F' : undefined} variant="label">{due}</Text> : null}
                {x.type === 'piutang' && !x.settled ? <Text variant="small" muted>{t('journal.ledger.graceHint')}</Text> : null}
                {x.type === 'wasiat' ? <Text variant="small" muted>{t('journal.ledger.willHint')}</Text> : null}
                <Row>
                  {x.type !== 'wasiat' ? (
                    <Button title={x.settled ? t('journal.ledger.unsettle') : x.type === 'amanah' ? t('journal.ledger.fulfil') : t('journal.ledger.markPaid')} variant="secondary" onPress={async () => { await settleLedgerItem(db, dek, x.id, !x.settled, today); bump(); void reschedule(); }} />
                  ) : null}
                  <Button title={t('journal.ledger.edit')} variant="ghost" onPress={() => router.push({ pathname: '/ledger/[id]', params: { id: x.id } })} />
                  <Button title={t('journal.common.delete')} variant="ghost" onPress={() => remove(x.id)} />
                </Row>
              </Card>
            );
          })}
          <SectionTitle>{t('journal.ledger.notesTitle')}</SectionTitle>
          <Text variant="small" muted>{t('journal.ledger.notesBody')}</Text>
        </>
      )}
    </Screen>
  );
}
