# i18n review: ms, fr, de, es, nl

Reviewer: Claude (language model, not a native speaker). Job A: `src/i18n/extra/<code>.ts` created for all five (not registered in index.ts). Job B: review of `src/i18n/locales/<code>.ts`. Validation: `tsc` filter empty for all; placeholder tokens and array lengths verified identical to English for locales and extras.

Register of the extra files matches each locale: ms "anda", fr "vous", de "du", es "tu" (tuteo), nl "je".

General limitation (all five, same as English source): plural strings such as "{n} actions secrètes", "{n} días", "{n} dagen te laat" are not singular-aware for n=1 (needs separate keys or ICU plural; not fixable in-file).

## Malay (ms)

### 1. Fixes applied
- journal.ledger.dueToday: "Tamat tempoh hari ini" -> "Tarikh akhir hari ini" ("tamat tempoh" means "expired").
- journal.ledger.dueOn: "Tamat tempoh {date} ..." -> "Tarikh akhir {date} ..." (same reason).
- missions.home.dueTitle: "Catatan hampir tamat tempoh" -> "Catatan menghampiri tarikh akhir" (same reason).
- prefs.notif.dueBody: "...yang tamat tempoh hari ini" -> "...yang tarikh akhirnya hari ini" (same reason).
- groups.members.pray: "Kirim doa" -> "Hantar doa" ("kirim" is Indonesian; Malaysian is "hantar").
- tasbih.note: "HR Abu Dawud" -> "riwayat Abu Dawud" ("HR" is an Indonesian abbreviation).

### 2. Needs native review (by risk)
1. journal.ledger.types.piutang "Hutang orang kepada saya": awkward; "Orang berhutang dengan saya" may be more natural (but longer for a chip).
2. quran.translit "Rumi" for Transliteration: common in Malaysia but literally "Latin script"; may confuse. Also quran.sources uses "rumi:".
3. "mengingati mati" (onboarding, tagline, adab3): idiomatic (zikrul maut) but blunt; some prefer "mengingati kematian".
4. missions.badgeGrid.showLess "Tunjuk kurang": slightly stiff; "Papar kurang" is an alternative.
5. "Perbaharui niat" (journal.visibility.shareHint): DBP-preferred form may be "Baharui".
6. journal.ledger.willHint "peguam" for notary (formally "notari awam"; Amanah Raya is common for wills in Malaysia).
7. Streak rendered "rentetan"; check it matches what Malaysian users call it.

### 3. Confidence: medium-high
Vocabulary is already Malaysian (peranti, e-mel, kod laluan, Zohor/Syuruk/Isyak, Kaabah, Jumaat, weekday abbreviations). Remaining doubt is mainly nuance of Islamic and UI idiom.

## French (fr)

### 1. Fixes applied
- journal.reflection.gratitudeLabel: "Ce dont je suis reconnaissant aujourd'hui" -> "Ce pour quoi je rends grâce aujourd'hui" (removes masculine default).
- missions.home.newBody: "Quand vous serez prêt," -> "Quand vous le souhaitez," (gender-neutral).
- missions.provision.helpBody: "Si vous vous sentez dépassé ... pas seul." -> "Si tout vous paraît insurmontable ... pas seul(e)." (gender-neutral; sensitive context).
- missions.badges.learn-5.title: "Étudiant" -> "En quête de savoir" (masculine, and "étudiant" implies school).
- groups.rank.intro: "pas pour être loué" -> "pas pour recevoir des éloges" (gender).
- quran.noLastRead: "où vous vous êtes arrêté" -> "l'endroit où vous vous arrêtez" (gender).
- hub.items.reflection: "Examen de conscience" -> "Introspection" (Catholic term; app already uses "Muhâsaba" elsewhere).

### 2. Needs native review (by risk)
1. Transliteration styles are mixed: circumflex scholarly style (Muhâsaba, Bukhârî, shâ', Âmîn, du‘â') next to plain Fajr/Asr/Maghrib/Icha and the macron Arabic phrases in tasbih.phrases (source). Pick one system (a community-conventional plain style such as "Hadith, Dhikr, Doua, Amine, Boukhari" is also common).
2. salat.names: "Dhohr", "Icha" vs "Fajr", "Asr", "Maghrib" (French usage varies: Dohr/Dhor/Dhuhr, Maghreb/Maghrib).
3. journal.categories.ilmu / missions.categories.ilmu "Science": reads as "science" in everyday French; "Savoir" is clearer.
4. journal.screen.uzur "Jour d'excuse": calque; "Jour de dispense" may be more natural.
5. missions.list.seasonal "Jours & périodes bénis": adds the word "blessed" absent from the English.
6. hub.items.tasbih "Chapelet (tasbîh)": "chapelet" has Catholic connotation and the label is long for a grid cell.
7. Masculine-default adjectives remain in badge/level titles ("Généreux", "Constant", "Serein", "Mûr", "Affermi") and "reconnaissant"-style forms elsewhere; "Serein" for "Assured" is a loose match.
8. "pour l'amour d'Allah" (niyyahLabel): idiomatic but some prefer "pour Allah" / "pour la face d'Allah".
9. "Même sexe" for same-gender groups (vs "même genre").
10. checkin.title "Bilan quotidien" is loose for "Daily check-in".

### 3. Confidence: medium-high
Fluent, consistent register ("vous"), Islamic terms generally correct; risks are style (transliteration system) and gender neutrality.

## German (de)

### 1. Fixes applied
- groups.home.intro: "Wetteifert ... eurer Gemeinschaft" -> "Wetteifere ... deiner Gemeinschaft" (the file uses "du"; this line switched to "ihr").
- groups.rank.intro: "Wetteifert im Guten" -> "Wetteifere im Guten" (du/ihr).
- groups.rank.offBody: "Konzentriert euch" -> "Konzentriere dich" (du/ihr).
- groups.feed.emptyBody: "Sei der Erste, der ..." -> "Sei die erste Person, die ..." (gender).
- groups.members.approvalNote: "Jeder, der beitritt, braucht" -> "Alle, die beitreten, brauchen" (gender).
- missions.badges.learn-5.title: "Lernender" -> "Wissbegierig" (masculine).
- missions.detail.savedSent: "ein anderer Teilnehmer" -> "eine andere teilnehmende Person" (gender; matches "Teilnehmende" used elsewhere).
- Extra file: first drafted with formal "Sie"; rewritten to "du" to match the locale.

### 2. Needs native review (by risk)
1. tabs.worship / hub.title / salat.disclaimer / reminders "Gottesdienst" for Ibadah/worship: reads as Christian church service to some; alternatives "Anbetung", "Ibada", "Gottesdienst (Ibada)". Affects a tab label.
2. Length: hub.items.journal "Tagebuch guter Taten", hub.items.provision "Wegzehrung für heute" (20 chars) may wrap in grid cells; missions.levels.6 "Gefestigt im Vertrauen" is long for a pill.
3. "Wegzehrung" has Christian (viaticum) connotation; "Proviant" / "Reiseproviant" is more neutral.
4. Transliteration mixes DMG-style (Fadschr, Ischa, Dschumu‘a, Hidschri, Dschuz', Schafi‘i, scha' Allah) with plain forms (Dhuhr, Dhikr, Asr, Maghrib, Alhamdulillah, Assalamu alaikum). Dhuhr/Dhikr would be "Duhr"/"Zikr" in strict DMG.
5. groups.feed.blockBody "Ihr seht die Inhalte des jeweils anderen nicht mehr": "ihr" addresses both parties; ok but differs from "du".
6. "Nutzer" (groups.feed.blockTitle, minor/unavailable text) generic masculine.
7. "Spende" for sadaqa (category "Spende"): sadaqa is voluntary charity; "Spende" is acceptable but "Sadaqa" is used in German Muslim communities.
8. settings.system "Wie Gerät": terse.

### 3. Confidence: medium-high
Natural, consistent "du" register after fixes; terminology generally sound. Main doubts are the "Gottesdienst" convention and transliteration policy.

## Spanish (es)

### 1. Fixes applied
- groups.home.intro: "Competid ... vuestra comunidad" -> "Compite ... tu familia, tus amigos o tu comunidad" (file uses tuteo; this was vosotros).
- groups.rank.offBody: "Centraos en la unión" -> "Céntrate en la unión" (vosotros -> tú).
- groups.rank.intro: "Competid ... para ser alabados" -> "Compite ... para recibir alabanzas" (vosotros/masc.).
- groups.feed.blockBody: "Ya no veréis el contenido del otro." -> "Ya no verás su contenido, y esa persona tampoco verá el tuyo." (vosotros -> tú).
- salat.names.maghrib: "Magrib" -> "Maghrib" (the other five prayer names use unhispanized forms Fajr/Dhuhr/Asr/Isha).
- journal.reflection.gratitudeLabel: "Por lo que estoy agradecido hoy" -> "Lo que agradezco hoy" (gender).
- missions.home.newBody: "Cuando estés listo," -> "Cuando quieras," (gender).
- missions.provision.helpBody: "te sientes desbordado ... no estás solo" -> "sientes que todo te supera ... no tienes por qué afrontarlo a solas" (gender; sensitive context).
- missions.badges.circle-join.title: "Unido a un grupo" -> "Miembro de un grupo" (gender).
- groups.feed.emptyBody: "Sé el primero" -> "Sé la primera persona" (gender).
- qibla.facing: "Estás orientado hacia la alquibla" -> "Estás mirando hacia la alquibla" (gender).
- journal.visibility.public: "amigos de grupo" -> "amigos del grupo".
- Extra file: first drafted with "usted"; rewritten to tuteo to match the locale.

### 2. Needs native review (by risk)
1. Mixed hispanized vs plain transliteration: Alquibla, Yumu‘a, Yuz, jatm, Bujari, Mequí/Mediní, hiyrí, sura, aleya versus Dhikr, du‘a, Fajr, Dhuhr, Isha, niyya, adab, Eid. Choose one policy (e.g. Comisión Islámica de España forms: Fayr, Duhr, Asr, Magrib, Isha).
2. quran.meccan/medinan "Mequí"/"Mediní": "mediní" is unusual; "medinense" is the common adjective.
3. Gender of "zakat" ("el zakat" in about.note5; Muslim Spanish usage varies between el/la).
4. "Yuz"/"Yuz {n}" for Juz': uncommon; "Yuz" vs "Juz".
5. hadith quotes use vosotros ("Que ninguno de vosotros...", "Protegeos del Fuego") while the UI uses tú; conventional for quoted hadith, but Latin American users may prefer "ustedes".
6. "Generoso", "Seguro", "Maduro" level/badge titles masculine; "Seguro" for "Assured" is loose.
7. "Eid" (calendar.note) vs "Aíd"/"Id"; "Ramadán" accent is fine.
8. "Misbaha (tasbih)": long for a hub cell; "tasbih" alone may be enough.
9. "Registro diario" for "Daily check-in" is loose.

### 3. Confidence: medium
Translation is accurate and the Islamic meaning is carefully preserved, but terminology conventions (hispanized vs plain) are unsettled and I cannot judge regional (Spain vs Latin America) preferences.

## Dutch (nl)

### 1. Fixes applied
- missions.provision.items.sedekah.title: "Geef liefdadigheid, hoe klein ook" -> "Geef iets aan het goede doel, hoe klein ook" ("geef liefdadigheid" is not idiomatic).
- common.reset: "Herstellen" -> "Resetten" ("herstellen" means restore/repair, ambiguous on a Reset button).
- tasbih.reset: "Teller herstellen" -> "Teller resetten" (same reason).
- home.nextPrayer: "Volgende gebed" -> "Volgend gebed" (het-word agreement).
- missions.home.footer: "Vul vandaag met je beste." -> "Vul vandaag met het beste van jezelf." (incomplete phrase).
- Extra file: first drafted with formal "u"; rewritten to "je/jouw" to match the locale.

### 2. Needs native review (by risk)
1. Transliteration mixes Dutch-style (Soera, soennah, Djumu‘a, Hidjri, "fiek", "Amien") with international style (Fajr, Dhuhr, Isha, Maghrib, Dhikr, Tirmidhi, Hashr, Ka‘bah, Juz, du‘a). Choose one policy; note "Juz" would be "Djoez" in Dutch style.
2. "Aanbidding" for Ibadah (tabs.worship, hub.title): fine but "Eredienst" is the other common choice; note "aanbidding" can imply veneration.
3. missions.points "ptn": unusual abbreviation ("pnt." / "pt.").
4. missions.badges.learn-5.title "Leerling": means pupil; "Kenniszoeker" may fit better.
5. groups.feed.blockBody "Jullie zien elkaars inhoud niet meer": "inhoud" is vague; "berichten" may be better.
6. "Te voldoen" for "due" (ledger.dueToday/dueOn, missions.home.dueTitle): correct but formal.
7. "Gebedskralen" for tasbih: could keep "Tasbih" or "Tasbih (gebedssnoer)".
8. "mededeelnemer" (savedSent) is a rare word.
9. Quran terminology: "Medinensisch" vs "Medinees"; "Mekkaans" ok.

### 3. Confidence: medium-high
Idiomatic and consistent "je" register; errors found were few. Doubts are about transliteration policy and religious word choice.
