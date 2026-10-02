/**
 * Teks tambahan (fitur baru). Bahasa selain en/id boleh belum menerjemahkan bagian ini:
 * `translate` jatuh ke bahasa Inggris. Tambahkan src/i18n/extra/<kode>.ts lalu daftarkan di index.ts.
 */
const extra = {
  help: {
    emergency: 'Emergency services {number}',
    emergencyUnsure: 'Emergency services {number} (check your local number)',
    kemenkes: 'Ministry of Health line {number} (Indonesia)',
    findHelp: 'Find a helpline in your country',
    note: 'If you are in danger or thinking of harming yourself, contact emergency services or a trusted person right now.',
  },
  money: {
    currency: 'Currency',
    currencyAuto: 'Auto ({code})',
    currencyHint: 'Used for debts and trusts. Existing amounts keep their numbers; only the label changes.',
    amountLabel: 'Amount ({code}, optional)',
  },
  legal: {
    title: 'Legal',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    updated: 'Last updated: {date}',
    languageNote: 'The legal texts are provided in English and Indonesian. If a translation differs, the English version prevails.',
    contact: 'Contact',
    openWeb: 'Open on the web',
  },
  support: {
    title: 'Support NAFS',
    menu: 'Support NAFS',
    lead: 'NAFS is free, has no ads, and never sells your data. If it benefits you, you may help cover servers, translations, and scholar review costs.',
    principles: 'Our promises',
    p1: 'Giving is entirely voluntary. Every feature stays free for everyone.',
    p2: 'Giving never changes points, levels, badges, or rankings, and nothing here promises a reward — reward is with Allah alone.',
    p3: 'This is not zakat. For zakat and charity, give directly or through an official institution in your country.',
    p4: 'Never give if it burdens you or your family. Praying for the app and sharing it is also help.',
    usage: 'Where it goes',
    usageBody: 'Servers and database, translation and scholar review, store fees, and development time. A short yearly transparency report is planned.',
    cta: 'Give via the web',
    unavailable: 'Giving is not open yet. Thank you for your intention — jazakumullahu khayran.',
    storeNote: 'In the app-store versions, giving may open outside the app, in line with store rules.',
    thanks: 'Jazakumullahu khayran for your support.',
  },
};

export default extra;
export type Extra = typeof extra;
