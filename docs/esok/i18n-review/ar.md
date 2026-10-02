# i18n review: ar, ur, fa, ps, bn

Reviewer is a language model, not a native speaker. All five `extra/<code>.ts` files were created (not registered in index.ts). `tsc --noEmit` is clean for all `locales/` and `extra/` files of these languages. Placeholder tokens verified identical to English for every file (script check).

Cross-language decisions applied (flag for native decision):
- Tasbih phrases (`tasbih.phrases.*`) were left as Latin transliteration in all five files. Replaced with native-script text in each language.
- fa, ps, bn mixed native-script digits (about 40 strings each) with Latin digits (the majority, and what runtime `{n}` renders). Normalised prose digits to Latin (0-9). A native speaker may prefer native digits everywhere, but that needs a number-formatting change in code, not just strings.

---

## ar (Arabic)

### 1. Fixes applied
- `groups.nudges.ingat` فنحن يذكّر بعضنا بعضًا → فنحن نذكّر بعضنا بعضًا (agreement error)
- `journal.screen.weekdays[1]`, `calendar.weekdays[0]`, `calendar.legend` إثنين/الإثنين → اثنين/الاثنين (hamzat al-wasl, standard spelling)
- `missions.tones.khauf` تذكرة → تذكير ("تذكرة" reads as "ticket" in modern Arabic)
- `groups.shared.doAndMark` افعلها وضع علامة الإنجاز → افعلها وسجّل إنجازها (ungrammatical)
- `tasbih.phrases.*` Latin transliteration → سبحان الله / الحمد لله / الله أكبر / لا إله إلا الله / أستغفر الله
- `prefs.auth.recoveryShareButton` انسخ/شارك إلى مكان آمن → انسخه أو شاركه في مكان آمن (wrong preposition)

### 2. Needs native-speaker review (highest risk first)
1. `journal.screen.uzurHint` / `uzur` "حيض" (menstruation) stated explicitly; correct but blunt in a general UI. Consider "عذر شرعي (كمرض أو سفر ...)".
2. Count nouns with `{n}`: "{n} أيام", "سلسلة {n} أيام", "متأخر {n} أيام", "{n} طلبات", "{n} مساهمين", "{n} أذكار", "{n} مشاركين". Arabic number agreement (1, 2, 3-10, 11+) cannot be expressed with a single string; will read wrong for n=1, 2, 11+, 30. Needs plural handling in code or number-neutral phrasing ("عدد الأيام: {n}").
3. Masculine imperatives throughout (صلِّ، أنجِزها، تخطَّ، اعتذر ...). Default masculine is normal Arabic UI, but female users may notice; list only.
4. `journal.reflection.niyyahQuote`: only the first clause of the hadith ("إنما الأعمال بالنيات") is quoted, with a closing quote. Fine as an excerpt; scholar may want "... وإنما لكل امرئ ما نوى".
5. Terminology consistency: reflection is "التأمّل" in journal/missions but "محاسبة النفس" in `hub.items.reflection` (and "المحاسبة" in journal). Probably intended (feature vs. concept), but check.
6. `missions.categories.sosial` "اجتماعي" (adjective) vs `journal.categories.sosial` "المجتمع" (noun). English also differs (Social/Community), left as is.
7. `tabs.profile` "الملف الشخصي" is long for a tab label (13 chars); "حسابي" or "ملفي" would fit better. Not changed.
8. `common.approx` / `home.hijri` "تقريبًا" and "هـ" are fine.
9. `hub.items.tasbih` "المسبحة" (the physical beads) matches English "Prayer beads", but the feature is a counter; "التسبيح" may be more apt.
10. `qibla.turn` "استدر {dir} {deg}°" with يسارًا/يمينًا reads "استدر يسارًا 30°"; fine.

### 3. Confidence
**High** for Islamic terminology and register (Modern Standard Arabic, formal-polite, hadith/Qur'an text matches known wording). Medium on UI conciseness and plural handling (see item 2).

---

## ur (Urdu)

### 1. Fixes applied
- `prefs.onboarding.introTitle`, `prefs.about.tagline`, `groups.members.inviteTagline`: "آج ایسے جیو جیسے کل نہ ہو" → "آج ایسے جئیں جیسے کل نہ ہو" (informal "tum" imperative clashed with the "aap" register used everywhere else)
- `groups.members.kick` نکالیں → ہٹائیں (English "Remove"; "نکالیں" = expel, harsh)
- `prefs.onboarding.adab2Before` "بطورِ طے شدہ" → "ڈیفالٹ طور پر" (unidiomatic for "by default")
- `prefs.auth.signOutBody` "یہ مناسب ہے" → "ایسا کرنا بہتر ہے" (awkward for "recommended")
- `tasbih.phrases.*` Latin → سبحان اللہ / الحمد للہ / اللہ اکبر / لا الٰہ الا اللہ / استغفر اللہ
- `quran.khatam` "ختم کی پیش رفت" → "ختمِ قرآن کی پیش رفت" ("ختم" alone is ambiguous: "end/finish")

### 2. Needs native-speaker review (highest risk first)
1. `missions.badgeGrid.summary`, `prefs.profile.badges`, `prefs.profile.honorModeHint`, about.note3: "بیج" for "badge". "بیج" also means "seed" in Urdu. Context disambiguates, but "تمغہ" / "نشان" may be safer; "تمغہ" may imply award/rank, which the app wants to avoid.
2. `journal.ledger.types.piutang` "مجھے واجب الادا" for "Owed to me": "واجب الادا" means "payable", so this reads "payable to me", which is acceptable but not the most natural. "مجھے ملنے والی رقم" may be clearer.
3. "درجہ" is overloaded: level (`missions.detail.difficulty`, `levelPill`), tier (`badgeGrid`: "درجے"), and ranking uses "درجہ بندی". The reader may confuse level, tier, and ranking.
4. `journal.reflection` / "غور و فکر" used as a countable noun ("غور و فکر نجی ہیں", "ایک غور و فکر محفوظ ہے"); slightly unnatural plural usage. Consider "محاسبہ/تأمل" or "خود احتسابی".
5. `groups.rank.offBody` "باہمی ساتھ پر توجہ دیں" is awkward; "آپس کی یکجہتی پر توجہ دیں" is more idiomatic.
6. `missions.home.consistencyPoints` "پابندی پوائنٹس" and levels "پابند": "پابندی" also means "restriction/ban" (as in "پابندی لگانا"). In the sense of regularity (نماز کی پابندی) it is correct, but a different word such as "تسلسل" / "استقامت" avoids the negative reading.
7. Count agreement fine in Urdu (plural not inflected after numerals), but `streak` "{n} دن کا سلسلہ" ok.
8. Register of hadith lines ("آگ سے بچو") uses "tum"; acceptable for a direct quotation.
9. "آلہ" for device (vs. the more common "ڈیوائس"); consistent across file and understandable.
10. `groups.kinds.sesama_jenis` "صرف مرد یا صرف خواتین" is longer than English "Same gender" (chip width), and replaces "same gender" with "men-only or women-only". Meaning is right.

### 3. Confidence
**Medium-high.** Terminology (ثواب، صدقہ، امانت، وصیت، مباح) and respectful register are good; the word-choice items above are about nuance, not meaning errors.

---

## fa (Persian)

### 1. Fixes applied
Main problem: the file mixed formal-plural "شما" with informal singular "تو" imperatives, sometimes inside a single screen/sentence (for example the "Today's provision" items and hints). Normalised everything to polite "شما" forms:
- `journal.visibility.shareHint` نیتت را تازه کن → نیتتان را تازه کنید
- `journal.reflection.regretHint` بخواه → بخواهید
- `journal.vault.lockNow` قفل کن → قفل کنید
- `journal.ledger.fulfil` ادا کن → ادا کنید
- `missions.detail.complete` انجامش بده → انجامش دهید
- `missions.home.footer`, `provision.intro`, `provision.items.*` (title + hint for all 7 items), `provision.ledgerBody`, `provision.hopeTitle`, `badgeGrid.allDone`, `groups.nudges.ingat/doa`, `groups.shared.doAndMark`, `groups.members.inviteJoin`, `quran.khatamNote`, `prefs.reminders.testBody` ("امیدوارم امروزت" → "امیدواریم امروزتان") all from "تو" to "شما" forms
- Motto "امروز را چنان زندگی کن که گویی فردایی نیست" → "...زندگی کنید..." (3 places: onboarding.introTitle, about.tagline, members.inviteTagline); inviteTagline "بیا" → "بیایید"
- `prefs.onboarding.introBody`, `adab1Before`, `adab1Bold` ("نه ارزش پاداش تو" → "شما"), `adab3` ("ناامید مشو" → "ناامید نشوید")
- `groups.members.kick` برداشتن → حذف عضو ("برداشتن" = pick up, unclear)
- `missions.home.hijri` "ق" → "ه.ق" (standard abbreviation for Hijri lunar)
- `tasbih.phrases.*` Latin → سبحان‌الله / الحمدلله / الله‌اکبر / لا اله الا الله / استغفرالله
- Persian-Indic digits (43 occurrences, e.g. ۱۳, ۷, ۱۰۰) → Latin digits, matching the other 126 Latin occurrences and runtime `{n}`

### 2. Needs native-speaker review (highest risk first)
1. Digit decision (see top): Persian speakers expect Persian digits; Latin digits chosen for consistency with runtime values.
2. "مأموریت" for "Mission" (used across tabs, titles, badges): in Persian it means an official assignment or secret operation; could sound militaristic or like a business trip. Alternatives: "کار روزانه", "چالش", "هدف". Subjective, left; the term is consistent.
3. Persian week starts on Saturday (شنبه), but the arrays follow the English order (Sun/Mon first) as required; the calendar grid will look unusual to Iranian users. Needs a code-level locale decision.
4. `journal.screen.uzurHint` "عادت ماهانه" is a polite euphemism; fine. "عذر شرعی" fine.
5. "گاوصندوق" (vault) conveys a physical safe; "صندوق امن" or "گنجینهٔ خصوصی" would be gentler. Left.
6. "زنجیره" for streak: slightly literal ("chain"); "پیاپی" / "رشتهٔ روزها" may be more natural. Left.
7. Hadith wording: "جان مؤمن در گرو بدهی اوست" and the will hadith are standard; the Muhammad-related wording matches common Persian translations but a scholar should confirm.
8. `tabs.journal` "دفتر" alone is short but ambiguous (notebook/office). "دفتر اعمال" is used in hub; the tab label may need disambiguation.
9. "نشان" (badge) vs. "نشانک" (bookmark): near-identical words in different features; fine but note.
10. Mixed digits remain inside quoted references (e.g. "ش. 1078", "59:18") now Latin like the rest.

### 3. Confidence
**Medium.** Vocabulary is accurate and Islamic terms are standard Persian usage; the main defect (register mixing) is fixed. Remaining risk is stylistic (Mission term, vault term) and digit convention.

---

## ps (Pashto)

### 1. Fixes applied
- `prefs.security.newPassphraseHint` "ستاسو زړه د بیا رغونې کیلي اعتبار لري" → "ستاسو زاړه ..." (**mistranslation**: "زړه" = heart; intended "زاړه" = old, i.e. "Your old recovery key stays valid")
- Motto "نن داسې ژوند وکړه لکه سبا چې نه وي" → "...وکړئ..." (3 places; singular imperative vs. polite plural elsewhere)
- `tasbih.phrases.*` Latin → سبحان الله / الحمد لله / الله اکبر / لا إله إلا الله / استغفر الله
- `checkin.title` "ورځنی حاضري" → "ورځنۍ حاضري" (gender agreement with feminine noun)
- "اندونیزیايي" → "اندونیزیایي" (2 places; mixed yeh forms)
- Persian-Indic digits (38) → Latin digits (see top)

### 2. Needs native-speaker review (highest risk first)
1. `journal.ledger.dueToday` "نن یې موده ده", `dueOn` "موده {date}", `form.due` "د مودې نېټه", `reminders.due`, `home.dueTitle`: "موده" = period/duration, not "due date"; these read awkwardly ("its period is today"). A native word for "due/maturity date" (e.g. "د ادا نېټه") is probably better. Not changed because I am not sure of the best idiom.
2. "غور" used alone as the noun for "reflection" (`reflection`, `غورونه`, `د ماښام غور`): clipped; may read as "listening/consideration". "فکر او غور" is used in one place; consistency and natural plural need a native check.
3. Weekday names use the Dari/Persian forms (یکشنبه، دوشنبه ...), common in Afghan usage but there are native Pashto names (اتوار، ګل، ...). Check which the audience expects. The hijri `weekdays` arrays follow English ordering as required.
4. "درجه بندي" is used for ranking and "درجې" for badge tiers (same root, may confuse).
5. "نمرې" for points: also means school grades/marks. Understandable.
6. `quran.bookmarks` "نښې" and verb "نښه کول": "mark" is generic, may be confused with "marked as last read" (also "نښه").
7. Counting nouns plural forms after `{n}` (e.g. "{n} ورځې", "{n} آیتونه"): Pashto plural/oblique forms may differ; not verifiable.
8. Mixed ل/ي letter forms elsewhere (Arabic vs. Pashto yeh/kaf) not systematically checked.
9. `groups.reactions.barakallah` "بارک الله فیک" is Arabic form directly; acceptable.
10. `groups.block` "بندول" (close/shut) may read as "disable" more than "block a user".

### 3. Confidence
**Medium-low.** I found one real mistranslation (heart vs. old), which suggests other subtle errors may remain. Pashto resources are thinner than for the other four; treat as needing a full native proofread before release, particularly the due-date terms.

---

## bn (Bengali)

### 1. Fixes applied
- `missions.provision.items.sedekah.hint` "জাহান্নাম থেকে বাঁচো" → "বাঁচুন" (informal singular verb among polite "আপনি" forms)
- `prefs.auth.signOutBody` "এটি পরামর্শযোগ্য" → "এটি করার পরামর্শ দেওয়া হয়" (unidiomatic)
- `prefs.about.note2` "উদ্ধৃতিগুলো আলেমদের দ্বারা নিয়মিত পর্যালোচনা প্রয়োজন" → "উদ্ধৃতিগুলোর জন্য আলেমদের নিয়মিত পর্যালোচনা প্রয়োজন" (broken grammar)
- `tasbih.phrases.*` Latin → সুবহানাল্লাহ / আলহামদুলিল্লাহ / আল্লাহু আকবার / লা ইলাহা ইল্লাল্লাহ / আস্তাগফিরুল্লাহ
- Bengali digits (43) → Latin digits (see top)

### 2. Needs native-speaker review (highest risk first)
1. Digit decision: Bengali users strongly expect Bengali digits (০-৯); Latin digits chosen only for consistency with runtime `{n}`.
2. "আমলনামা" for the journal (tab label and titles): traditionally the record of deeds presented on the Day of Judgement. Using it for a personal diary may feel presumptuous or theologically weighty to some users; alternatives: "আমলের খাতা", "ভালো কাজের ডায়েরি".
3. `missions.detail.basis` "দলিল": in Bangladesh/India "দলিল" is commonly a land/legal deed; in Islamic context it means evidence. Probably understood, but "প্রমাণ/ভিত্তি" is safer.
4. `hub.items.reflection` "আত্মসমালোচনা" (self-criticism) vs. "আত্মচিন্তা" elsewhere and "মুহাসাবা" in the journal: inconsistent, and "সমালোচনা" has a negative tone.
5. "ইলম", "সদকা", "ইখলাস মোড", "অসিয়ত", "আমানত": transliterated Arabic terms; correct and common for Bengali Muslims, but "ইলম" as a category label may be less clear than "জ্ঞান" for casual users.
6. `journal.screen.uzurHint` "ঋতুস্রাব": correct but formal; fine.
7. Weekday abbreviation "বৃহঃ" for Thursday (others are full words); fine, short for headers.
8. Spelling variants: যাকাত written "জাকাত", "যোহর", "জিকির", "তিরমিজি": acceptable but not uniform with other Bengali Islamic sources (যাকাত/যিকর/তিরমিযি).
9. `groups.kinds.sesama_jenis` "একই লিঙ্গ" (same gender): clear.
10. Count suffix "টি" after `{n}` used consistently; works for inanimate nouns, but "{n} জন" (people) used where needed. OK.

### 3. Confidence
**Medium-high.** Fluent, polite, consistent register, accurate Islamic terms; remaining items are digit convention and a few word-choice nuances.
