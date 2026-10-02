# i18n review: zh, bs, sq, tl, th

Reviewer: Claude (language model, not a native speaker). Scope: JOB A (new `extra/<code>.ts`, not registered in index.ts) and JOB B (review of `locales/<code>.ts` against English). `npx tsc --noEmit` is clean for all five locales and extra files; placeholder tokens verified identical to English in every string.

---

## zh (Simplified Chinese, Hui wording)

### 1. Fixes applied
| key | old | new | why |
|---|---|---|---|
| groups.reactions.barakallah | 巴拉卡拉胡菲克 | 愿安拉赐福您 | phonetic transliteration is meaningless to most readers; now a real phrase ("May Allah bless you") |
| missions.detail.mubah | ...特定的贵重或回赐 | ...特定的优越性或回赐 | 贵重 means "valuable (object)", wrong register for "virtue" |
| journal.ledger.willHint | 咨询阿訇学者、您的继承人 | 咨询阿訇或学者、您的继承人 | "阿訇学者" reads as one title; EN is "a scholar" |
| prefs.onboarding.adab4 | 请请教可信赖的阿訇和老师 | 请向可信赖的阿訇和老师请教 | doubled 请 |
| prefs.about.note1 | 请请教有知识的人 | 请向有知识的人请教 | doubled 请 |
| qibla.bearing | 朝向方位：北偏 {deg}° | 朝向方位：自正北顺时针 {deg}° | "北偏 X°" does not say toward which side; EN is a bearing from north |

Extra namespace: translated (`src/i18n/extra/zh.ts`). Donation strings keep: voluntary, no effect on points/levels/badges/rankings, not 天课, no promise of reward (回赐唯在安拉), and "dua for the app is also help".

### 2. Needs native-speaker review (highest risk first)
1. Global: 安拉 vs 真主. File uses 安拉 everywhere. Many Hui readers say 真主 in daily speech; 安拉 is also standard (Ma Jian translation). Whole-file decision, not changed.
2. groups.reactions.barakallah "愿安拉赐福您" and extra `unavailable`/`thanks` "愿安拉赐您善报": my wording for the du'a; confirm it matches what Hui users actually say (e.g. 真主赐你好报).
3. hub.items.qibla / qibla.title "朝向" (2-char tab tile): standard in Chinese Islamic usage but ambiguous to non-Muslims; alternative 麦加朝向 / 吉卜拉.
4. missions.provision.title / hub.items.provision "今日干粮": literal "dry rations"; metaphor for provisions for the journey (zad). Could read as food. Alternative 今日行囊.
5. missions.home.greeting "色俩目": common abbreviated Hui greeting, but EN is the full Assalamu'alaikum; confirm tone (安塞俩目 is the fuller form).
6. Hadith citations use "第N段" (e.g. 第1078段) and mix 圣训实录 (Bukhari/Muslim) with 圣训集 (Tirmidhi). Number unit is usually 号; check preferred convention.
7. Transliterated terms: 沃西叶 (wasiyyah), 阿玛纳 (amanah), 尼耶提 vs 举意, 萨辉哈/哈桑 grades, 利亚 (riya), 杜阿. Spellings vary by community.
8. journal.ledger.form.amount still says "Rp" (shared with all languages; superseded by extra.money.amountLabel if wired).
9. hub.sections.together "共同": terse as a section header.

### 3. Overall confidence
Medium-high. Register, prayer names (晨礼/晌礼/晡礼/昏礼/宵礼, 主麻, 天课, 斋月, 尔德节) and Qur'an chapter names are consistent and idiomatic. Residual risk is the 安拉/真主 choice and a few transliterations.

---

## bs (Bosnian)

### 1. Fixes applied
Gendered paired forms replaced with neutral phrasing:
| key | old | new |
|---|---|---|
| journal.deed.whatLabel | Koje si dobro učinio/la? | Koje dobro djelo želiš zapisati? |
| journal.deed.whatPlaceholder | npr. Nazvao/la sam majku | npr. Poziv majci |
| journal.deed.noteHint | ljudi kojima si pomogao/la | osoba koje su dobile tvoju pomoć |
| groups.feed.composeHint | ljudi kojima si pomogao/la | osoba koje su dobile tvoju pomoć |
| journal.reflection.gratitudeLabel | Na čemu sam danas zahvalan/na | Za šta danas zahvaljujem |
| missions.detail.togetherDisabled | ...da bi radio/la misije zajedno | Za zajedničke misije uključi račun i oblak i pridruži se grupi. |
| missions.home.newTitle | Novi/a si u NAFS-u? | Prvi put u NAFS-u? |
| missions.home.newBody | Kada budeš spreman/na | Kada ti odgovara |
| missions.provision.items.maaf.hint | što si odgađao/la | što je odgođeno |
| missions.provision.helpBody | nisi sam/a | ne moraš to prolaziti u samoći |
| missions.badges.first-deed.description | Zapisao/la si svoje prvo djelo. | Zapisano je tvoje prvo djelo. |
| missions.badges.seven-days / thirty-days / streak-7 / streak-30 .description | Činio/la dobro ... | Dobro djelo učinjeno ... |
| missions.badges.circle-join | Član grupe / Pridružio/la si se grupi. | Pridruživanje grupi / Ostvareno pridruživanje grupi. |
| missions.badges.challenge-1.description | Doprinio/la si izazovu grupe. | Doprinos izazovu grupe. |
| groups.nudges.ingat | Jesi li danas učinio/la ... | Je li danas učinjeno bar jedno malo dobro djelo? ... |
| groups.circle.notFoundBody | ili si napustio/la grupu | Admin te možda još nije odobrio ili je tvoje članstvo prestalo. |
| groups.feed.emptyBody | Budi prvi/a koji poziva | Budi prva osoba koja poziva |
| groups.shared.joined | Pridružen/a | Pridruženo |
| prefs.auth.recoverySaved | Sačuvao/la sam ga... | Ključ je sačuvan na sigurnom mjestu |
| prefs.auth.passphraseHint | Ako si je već napravio/la | Ako je lozinka već kreirana na drugom uređaju |
| prefs.auth.useRecovery | Zaboravio/la si lozinku? | Zaboravljena lozinka? |
| prefs.security.setPinFirstBody | kako ne bi ostao/la zaključan/a | kako pristup aplikaciji ne bi bio blokiran |
| qibla.facing | Okrenut/a si prema kibli | Lice ti je okrenuto prema kibli |
| quran.noLastRead | gdje si stao/la | mjesto na kojem je učenje stalo |

Other fixes:
| key | old | new | why |
|---|---|---|---|
| missions.levels.3-8 | Marljiv, Ustrajan, Postojan, Siguran, Zreo, Utvrđen | Marljivost, Ustrajnost, Postojanost, Sigurnost, Zrelost, Čvrstina | masculine adjectives shown next to "Nivo N"; nouns are neutral |
| missions.badges family-5 / give-5 / learn-5 titles | Blizak porodici / Darežljiv / Učenik | Uz porodicu / Darežljivost / Učenje | same (masculine nouns/adjectives) |
| journal.screen.improve | Za popraviti: | Za poboljšanje: | "Za popraviti" is colloquial/ungrammatical |
| salat.disclaimer | svoju mesdžid | svoju džamiju | "mesdžid" is masculine, so "svoju" was a grammar error |
| journal.ledger.willHint | s učenim čovjekom | s alimom | consistency with "alim" used in adab4/note1 |

Extra namespace: translated (`src/i18n/extra/bs.ts`), written in the second person singular, neutral, Bosnian lexicon (uslovi, nivo, dova, zekat, sadaka, džezakumullahu hajran).

### 2. Needs native-speaker review
1. Please check that the new noun-style level and badge names read well (e.g. "Nivo 3 · Marljivost"). "Učenje" as the badge title for "Learner" reads oddly; "Znanje" or "Tragalac za znanjem" are alternatives.
2. Cancel = "Otkaži" (used in dialogs). "Odustani" is the usual dialog cancel; "Otkaži" is common on Android Bosnian but check.
3. Password = "Šifra" but passphrase = "Lozinka". Convention is usually lozinka = password; the split is intentional but may confuse.
4. missions.provision.title / hub.items.provision "Današnja opskrba": reads like utility "supply". Alternative "Putna zaliha za danas".
5. "Razmišljanje" for reflection (screen/profile); "Osvrt" or "Preispitivanje" might be more natural. hub.items.reflection uses "Samopreispitivanje" (long but OK).
6. hub.items.adhan "Obavještenja za ezan" (20 chars, longest tile label; tile wraps to 2 lines so acceptable).
7. Ekavian/ijekavian and Croatian-leaning forms ("Natječi se", "uvjeti" in older strings vs "uslovi" in the new extra file): extra uses "Uslovi korištenja"; locale has "Natječi se". Check regional preference.
8. "sevap" (about.note3) vs "nagrada" elsewhere. Both fine but inconsistent.
9. missions.home.hijri "{day}. {month} {year}. h. g.": check abbreviation.
10. salat.disclaimer "(npr. Islamsku zajednicu)" is Bosnia-specific; diaspora users may not have one.

### 3. Overall confidence
Medium-high. Terminology (nijet, zikr, dova, emanet, vasijjet, hajz, edžel, tevba, ibadet, ezan, akšam, jacija) is distinctly Bosnian and natural. The neutralisation edits are mine and should be spot-checked for naturalness.

---

## sq (Albanian)

### 1. Fixes applied
| key | old | new | why |
|---|---|---|---|
| groups.kinds.sesama_jenis | I njëjti gjini | Gjini e njëjtë | gender/case agreement error ("gjini" is feminine) |
| missions.home.newTitle | I ri në NAFS? | Hera e parë në NAFS? | masculine-only, neutral version |
| qibla.facing | Je i kthyer nga kibla | Po drejtohesh nga kibla | masculine-only, neutral version |

Extra namespace: translated (`src/i18n/extra/sq.ts`), matching existing lexicon (lutje, dijetarët, sadaka, zekat, xhezakumullahu khajran).

### 2. Needs native-speaker review
1. "Falja" (category forgiveness, journal/missions): also means "the (ritual) prayer" in Albanian Muslim speech ("falja e namazit") and sits next to "Ibadet". Consider "Ndjesa" or "Mëshirimi".
2. "Muhasebe" (journal.screen.muhasabah, titles): in Albanian muhasebe also means accounting; fine for Muslims but check clarity.
3. Remaining masculine-default adjectives (helpBody "ndihesh i mbingarkuar / nuk je vetëm", levels "I zellshëm / I qëndrueshëm...", "Dhurues bujar", "Nxënës"): conventional generic masculine, not changed.
4. "Distinktivët" for badges is stiff; "Shenjat" or "Medaljet" may be more common in apps.
5. "Raundi {n}" (tasbih, khatam) is an English loan; "Cikli" or "Rrethi" may be better.
6. "Reflektim"/"Vetëreflektim" vs "Refleksion"/"Vetëpërmbledhje".
7. "Dreka" for Dhuhr and "Sabahu", "Akshami", "Jacia", "Ikindia": Kosovo vs Albania usage differences (Dreka vs Dhuhri/Zuhri).
8. "Shpirti i besimtarit mbetet peng i borxhit" and the rest of the hadith wording: check against standard Albanian hadith translations.
9. "Misione" for missions (loan): fine, but "Detyra" or "Synime" may feel more natural.
10. Mixed use of "ueb" (new extra) vs "web"/"email" in the old file.

### 3. Overall confidence
Medium. Islamic vocabulary is idiomatic and consistent (nijeti, amanete, testament, sheriati, Ramazani, Bajrami). Fewer verified fixes than the other languages, which also means my coverage of subtle register issues is weaker.

---

## tl (Filipino)

### 1. Fixes applied
| key | old | new | why |
|---|---|---|---|
| missions.provision.items.shalat.title | Magdasal sa oras | Mag-salah sa oras | everywhere else uses "salah"; "magdasal" is generic/Christian-flavoured |
| missions.provision.items.shalat.hint | obligadong salah | fard na salah | "obligado" is a Spanish loan; "fard" is the term Filipino Muslims know |
| missions.provision.items.sedekah.hint | Ipagtanggol ang sarili sa Apoy | Protektahan ang sarili laban sa Apoy | "ipagtanggol" means defend/argue for, not shield |
| missions.home.honorMode, prefs.profile.honorOn, prefs.profile.honorMode | sincerity mode | mode ng sinseridad | English left unnecessarily |
| tabs.missions, tabs.groups | Mga Misyon, Mga Grupo | Misyon, Grupo | 6-tab bar; "Mga" removed to avoid truncation |
| hub.items.about | Tungkol at mga pinagmulan | Tungkol at sanggunian | longest hub label (25 chars), now 21 |

Extra namespace: translated (`src/i18n/extra/tl.ts`); keeps "zakat", "sadaqah", "du‘a" to match the rest of the file; app-store and UI nouns (server, database, app store, hotline, helpline) left in English as is standard in Filipino apps.

### 2. Needs native-speaker review
1. Pagsamba for ibadah / tab "Worship": standard Filipino for "worship" but also connotes church worship. Filipino Muslims often say "Ibadah". Used in tabs.worship, hub.title, journal/missions category.
2. Salah vs dasal vs sambahyang: the file now uses "salah" consistently (hub.sections.salat, prayer times, notifications). Confirm "Mag-salah" reads naturally and whether "Sambayang" (Maranao) is preferable for some audiences.
3. Kawanggawa (category, charity) vs "sadaqah" (items, notes): two words for one concept.
4. Terms left in English: Display name (prefs.onboarding.nameLabel, prefs.profile.displayName), Privacy, Settings, Profile, Home, Feed, Invite code, Target, Arabic font, "Ministry of Religious Affairs RI". Standard in Filipino apps, but consider "Pangalang ipinapakita", "Pribadong impormasyon".
5. "Puwedeng gawin nang sama-sama" (missions.canBeShared pill, 30 chars): long for a card badge. "Puwedeng sama-sama" would fit. If changed, also update groups.shared.emptyBody which quotes it.
6. "Kasama si" for "With"/"With whom" (journal.ledger.with, form.withWhom): reads as "with [name]"; as a form label it is odd.
7. "puntos ng pagpapatuloy" for consistency points: "pagpapatuloy" is continuation; "konsistensi/pagiging tuloy-tuloy" may be closer.
8. Hadith 1078 "nakabitin sa kanyang utang" (literal "suspended"; also colloquially "pending/unresolved"): confirm the meaning of "hostage" survives.
9. Levels "Panatag" (Assured), "Nakaugat" (Established): check connotation.
10. Gantimpala for reward: standard, but check community preference (e.g. "pabuya", "ganti").

### 3. Overall confidence
Medium. The text is fluent and idiomatic Filipino with sensible code-switching. Islamic term choice (salah/sadaqah/du‘a) is consistent. Main uncertainty is community-specific vocabulary (Pagsamba vs Ibadah, salah vs sambayang).

---

## th (Thai, Thai-Muslim wording)

### 1. Fixes applied
| key | old | new | why |
|---|---|---|---|
| journal.screen.uzur, journal.screen.uzurHint | วันที่มีอุปสรรค | วันที่มีเหตุจำเป็น | "อุปสรรค" = obstacle; EN is "excused day" and the hint itself says "เหตุผลอันสมควร" |

Extra namespace: translated (`src/i18n/extra/th.ts`) using the existing vocabulary (อัลลอฮ์, ซะกาต, ศอดะเกาะฮ์, ดุอาอ์, ผลบุญ, ผู้รู้, บริจาค). "การบริจาค" is used for giving to stay unambiguous.

### 2. Needs native-speaker review
1. groups.reactions.barakallah "บาเราะกัลลอฮุฟีก": phonetic transliteration, kept because Thai Muslims routinely write it this way. Alternative: ขออัลลอฮ์ทรงประทานความจำเริญแด่คุณ (long for a chip) or Arabic script. Medium risk.
2. ผลบุญ / บุญ (reward) and บริจาคทาน / ทาน (charity): these words have Buddhist connotations. They are widely used by Thai Muslims too, but some prefer ผลตอบแทน / ผลบุญจากอัลลอฮ์ and ศ่อดะเกาะฮ์. Used throughout (missions.provision.items.sedekah.title, adab1Bold, about.note3, extra.support.p2).
3. Notary translated "ทนายความ" (lawyer) in journal.ledger.willHint: closer to "lawyer" than "notary".
4. Spelling variants of Arabic terms: ศอดะเกาะฮ์/ศ่อดะเกาะฮฺ, ญุมอะฮ์, ซุฮ์ริ, กิบลัต, ตัสเบียะฮ์, ญะซากุมุลลอฮุ ค็อยรอน (the last one is mine in the extra file). Thai Muslim communities use different transliteration systems.
5. "วิญญาณ" for nafs/soul in hadith 1078 (nafs al-mu'min): may sound Buddhist; alternative "ชีวิต/จิตวิญญาณ".
6. "คำคม" for "quote" (about.note2, missions.quote.*): usually means witty sayings; for Qur'an/hadith "ข้อความ/ถ้อยคำ" could be more respectful.
7. "โหมดอิคลาศ" for "Sincerity mode": meaningful to Muslims, but non-Muslim or younger users may not know อิคลาศ.
8. Thai word wrapping: long no-space strings in hub tiles (ซิกรุลลอฮ์ทั้งหมด 17, หนี้สินและพินัยกรรม 19, ซิกรุลลอฮ์และดุอาอ์ 19 chars) may break mid-word since Thai has no spaces; test on device.
9. "ฉัน" first-person in checkbox/label strings is neutral but informal.

### 3. Overall confidence
Medium. Vocabulary is consistent and Thai-Muslim-appropriate (ละหมาด, ซะกาต, อิบาดะฮ์, หะดีษ, เนียต, มุฮาซะบะฮ์), and I found only one clear error. Risk is in transliteration conventions and Buddhist-flavoured words I cannot judge from the inside.
