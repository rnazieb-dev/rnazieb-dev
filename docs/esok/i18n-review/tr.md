# i18n review: tr, az, uz, kk, ru

Reviewer: Claude (language model, not a native speaker). Job A: `src/i18n/extra/<code>.ts` created for all five (not registered in index.ts). Job B: review of `src/i18n/locales/<code>.ts`. Keys, placeholders (verified by token count against English) and array lengths unchanged. `tsc` shows no errors for `locales/<code>` or `extra/<code>` for any of the five.

Cross-language flag: the "same gender" group kind (`groups.kinds.sesama_jenis` and its hint) is rendered with an expression meaning "same sex" in every language (tr "Aynı cinsiyet", az "Eyni cins", uz "Bir jinsli", kk "Бір жыныс", ru "Один пол"). In several of these languages the phrase is also used for same-sex relationships. A native speaker should confirm or pick a clearer wording, for example "men only / women only".

## Turkish (tr)

### 1. Fixes applied
- `missions.provision.makeMission`: "Görev yap" -> "Göreve dönüştür". The old text read as "do a mission"; the English is "Make it a mission".
- `missions.quote.notFound`: "Söz bulunamadı" -> "Alıntı bulunamadı". The rest of the file says "alıntı" for quote (`about.counts`).

### 2. Needs native review (highest risk first)
1. `journal.screen.muhasabah` "Muhasebe", `reflection.muhasabahTitle` "Akşam muhasebesi". In Turkish "muhasebe" also means accounting. The bare label could read as bookkeeping. Consider "Nefis muhasebesi" or "Muhasebe (özdenetim)".
2. Reflection terms are inconsistent: "Tefekkür" (journal), "Akşam tefekkürü" (home), "Nefis muhasebesi" (hub). English uses Reflection/Muhasabah. May be intentional.
3. `groups.kinds.sesama_jenis` "Aynı cinsiyet". See the cross-language flag.
4. `groups.*` challenge = "Meydan okuma" (defiance/challenge). It sounds confrontational for a collective, non-competitive feature. "Hedef" or "Ortak hedef" may suit better. It is used in tabs, badge titles and intro text.
5. `journal.screen.uzurHint` "hayız". It is correct religious terminology, but "adet" is more neutral in everyday UI. The Islamic term is probably fine for this audience.
6. `missions.provision.items.*` titles use informal singular imperatives ("Namazı vaktinde kıl", "Borcunu öde"). The hints use formal plural ("koruyun"). Mixed register.
7. `missions.levels.6` "Emin" (Assured). It means "sure/safe" and is also a personal name.
8. `journal.categories.diri` / `missions.categories.diri` "Nefis". Fine for the app's name, but "nefis" can carry a negative sense (lower self).
9. `checkin.title` "Günlük yoklama". "Yoklama" is roll call/attendance and sounds a bit formal.
10. `about.sourcesBefore` "Osmanî hat". It could be read as Ottoman calligraphy rather than the Uthmani script.
11. `security.envelopeMissing` "Zarf bulunamadı". Literal "envelope"; technical term, depends on the UI meaning.
12. `tabs`, `hub.items.*`, `salat.names`: lengths look fine ("Ana sayfa", "Ezan uyarıları").

### 3. Overall confidence
High. The file is idiomatic, with correct Islamic terms (sadaka, emanet, vasiyet, namaz vakitleri, ezan, kıble, Hanefî, etc.). Only two fixes were needed. Remaining risks are stylistic or terminology preferences.

Extra (Job A): translated. I used "Allah razı olsun" for "jazakumullahu khayran" (natural Turkish equivalent), and "sevap yalnızca Allah’ın katındadır", matching the main file. Medium-high confidence.

## Azerbaijani (az)

### 1. Fixes applied
- `journal.vault.intro`: "…şəxsi hesabınıza qoşulur" -> "…şəxsi xal cəminizə qoşulur". "hesab" also means "account" in this app, which made the sentence ambiguous. The English is "personal score".
- `prefs.profile.privateScore`: "Bu şəxsi hesab…" -> "Bu şəxsi xal…". Same ambiguity.

### 2. Needs native review
1. `groups.kinds.sesama_jenis` "Eyni cins". See the cross-language flag.
2. `journal.screen.muhasabah` "Mühasibə" and `hub.items.reflection` "Nəfs mühasibəsi". Close to "mühasibat" (accounting). The Islamic usage exists, but readers may not recognise it.
3. `quran.medinan` "Mədəni". Also means "cultural" in modern Azerbaijani. Surah-classification usage exists, but "Mədinə surəsi" may be clearer.
4. `about.sourcesBefore` "Osmani xətti". It may be read as Ottoman.
5. `checkin.title` "Gündəlik qeydiyyat". "Qeydiyyat" is registration.
6. `groups.*` "Çağırış" for challenge. Acceptable, but it can also mean "summons/call".
7. `missions.levels.6` "Əmin". It means "sure/safe".
8. Weekday abbreviations ("B.", "B.e.", "Ç.a.", …) are standard but cryptic. The order is correct (Sun-first in the journal, Mon-first in the calendar).
9. `calendar.legend`, `salat.names`, `adhkar` terms looked correct (Sübh, Zöhr, Əsr, Məğrib, İşa).

### 3. Overall confidence
High-medium. The text is fluent, the terminology is consistent, and the structure matches. Only the "hesab" ambiguity was clearly wrong.

Extra (Job A): translated. I used "ianə" for donation, "Allah razı olsun", "savab yalnız Allahın dərgahındadır" (matching the main file). Medium confidence on "Fövqəladə hal xidmətləri" for emergency services. "Təcili yardım" means ambulance specifically.

## Uzbek (uz)

### 1. Fixes applied
- `journal.vault.intro`: "Ballari faqat shaxsiy hisobingizga qoʻshiladi" -> "Ularning ballari faqat shaxsiy umumiy ballingizga qoʻshiladi". "Ballari" had no clear referent, and "hisob" means "account".
- `prefs.profile.privateScore`: "Bu shaxsiy hisob…" -> "Bu shaxsiy umumiy ball…". Same ambiguity.
- `journal.ledger.types.piutang`: "Mendan qarzdorlar" -> "Menga qarzdorlar". The ablative "mendan" read as "debtors from me". The dative gives "those who owe me" (and matches `emptyBody`).
- `missions.badges.seven-days` / `thirty-days` descriptions: "7 xil kunda" -> "7 ta turli kunda" (likewise 30). "xil" means "kind/type of", so the old text could read as "7 kinds of days".

### 2. Needs native review
1. `groups.kinds.sesama_jenis` "Bir jinsli". See the cross-language flag. In Uzbek the phrase is strongly associated with same-sex marriage in news usage, so this one is higher risk.
2. `common.reset` "Tiklash" (and `tasbih.reset` "Hisoblagichni tiklash"). "Tiklash" means restore/recover and collides with "Tiklash kaliti" (recovery key). Consider "Nollash" or "Asliga qaytarish".
3. `quran.medinan` "Madaniy". Also means "cultural". Standard in Uzbek Quran literature, but ambiguous out of context.
4. Challenge = "Musobaqa" (competition). The English feature is explicitly collective and non-competitive. "Vazifa/maqsad"-style wording may fit better.
5. Loanwords left as is: "post", "kontent", "spam", "admin". Common in Uzbek, so probably fine.
6. `journal.screen.muhasabah` "Muhosaba". Spelling follows Uzbek orthography, but readers may not know it.
7. `about.sourcesBefore` "Usmoniy rasm" is fine (names Uthman).
8. `missions.levels.6` "Ishonchli".
9. Apostrophes: the file consistently uses ʻ (oʻ, gʻ) and ʼ. The English "Qur’an" inside source citations is left as is.

### 3. Overall confidence
Medium-high. The text is idiomatic with correct prayer names (Bomdod, Peshin, Asr, Shom, Xufton). The four fixes were grammar and ambiguity issues I am fairly sure of. I am less sure about stylistic choices.

Extra (Job A): translated. I used "xayriya" for giving, "Alloh rozi boʻlsin", and "savob yolgʻiz Alloh huzuridadir". Medium confidence.

## Kazakh (kk)

### 1. Fixes applied
- Challenge terminology. The file used "сын" (plural "сындар") for challenge. In Kazakh "сын" means criticism, so "ұжымдық сындар" read as "collective criticisms". Replaced with the loanword "челлендж":
  - `groups.circle.tabs.tantangan` "Сындар" -> "Челлендждер"
  - `groups.home.intro`, `challenge.emptyTitle`, `emptyAdmin`, `emptyMember`, `createTitle`
  - `prefs.auth.accountPurpose`
  - `missions.badges.challenge-1`: "Сынға қатысты / Топ сынына үлес қостыңыз" -> "Челленджге қосылды / Топ челленджіне үлес қостыңыз". "қатысты" also means "related to", which was ambiguous.
- `journal.vault.intro`: "Ұпайлары тек жеке есебіңізге қосылады" -> "Олардың ұпайлары тек жеке жалпы ұпайыңызға қосылады". "Есеп" means account/score and was ambiguous.
- `prefs.profile.privateScore`: "Бұл жеке есеп…" -> "Бұл жеке жалпы ұпай…". Same ambiguity.
- `groups.home.minor`: "Күнделікті, тапсырмаларды…" -> "Амал күнделігін, тапсырмаларды…". "Күнделікті" alone means "daily/everyday", not the journal.
- `common.reset`: "Тастау" (throw away/discard) -> "Қалпына келтіру". `tasbih.reset`: "Санауышты тастау" -> "Санауышты нөлдеу".
- `missions.badges.seven-days` / `thirty-days`: "7 түрлі күні" -> "7 әртүрлі күні" (likewise 30).

### 2. Needs native review
1. `groups.kinds.sesama_jenis` "Бір жыныс". See the cross-language flag.
2. `common.reset` "Қалпына келтіру" is longer than a typical button. Alternatives: "Нөлдеу" or "Бастапқы қалпына".
3. "Челлендж" is a loanword. A native speaker may prefer "Сынақ", "Байқау" or "Жарыс", each of which has its own connotation (test or competition).
4. `journal.categories.diri` "Нәпсі". In Kazakh "нәпсі" is usually negative (base desires). The hub item "Нәпсіні есепке тарту" is a standard phrase.
5. `journal.screen.resolve` "Бекінім". "Бекіну" is a verb, and the noun "бекінім" is rare. Possible alternatives: "Шешім", "Бел байлау".
6. `journal.screen.reflection` "Ой толғау". Fine, but it sounds literary.
7. `checkin.title` "Күнделікті белгі". Vague.
8. `about.sourcesBefore` "Осман жазуы". "Осман" can mean Ottoman.
9. `missions.detail.mubah` "пазилет". Check the spelling (пазилет / фазилет).
10. Names of prayers (Таң, Бесін, Екінті, Ақшам, Құптан) are the standard Kazakh ones. Weekday abbreviations are correct (Sun-first in the journal, Mon-first in the calendar).

### 3. Overall confidence
Medium. Most of the text is good and idiomatic. The "сын" error shows the translation used literal calques in places, so there may be others I could not detect.

Extra (Job A): translated. I used "қайырымдылық" for giving, "Алла разы болсын", and "сауап тек Алланың құзырында". Medium confidence.

## Russian (ru)

### 1. Fixes applied
- Gender-neutral rewrites:
  - `journal.deed.whatPlaceholder` "Позвонил(а) маме" -> "Звонок маме"
  - `journal.reflection.niyyahLabel` "намерен(а) сделать" -> "намереваюсь сделать"
  - `journal.reflection.gratitudeLabel` "За что я благодарен(на) сегодня" -> "Благодарность за сегодняшний день"
  - `prefs.auth.recoverySaved` "Я сохранил(а) его…" -> "Ключ сохранён в надёжном месте"
  - `prefs.auth.consent` "Я согласен(на) на…" -> "Соглашаюсь на отправку данных в облако, как описано выше"
  - Badge `challenge-1` title "Принял вызов" -> "Вызов принят" (masculine form).
  - Badge titles `give-5` "Щедрый" -> "Щедрость", `forgive-3` "Великодушный" -> "Великодушие", `learn-5` "Ищущий знание" -> "Поиск знания".
- Plural agreement: `groups.rank.points` and `prefs.profile.points` "{n} баллов" -> "Баллов: {n}" (the old text gave "1 баллов", "2 баллов"). `prefs.profile.privateScore` "…видят только {n} баллов за дела…" -> "…видят только баллы за дела, которыми вы поделились: {n}."
- Grammar:
  - `missions.badges.seven-days` / `thirty-days` "в 7 разных дней" -> "в течение 7 разных дней" (likewise 30).
  - `missions.detail.savedPending` "Повторная попытка будет автоматически" (missing verb) -> "Повторная попытка произойдёт автоматически".
- `journal.visibility.public`: "Все друзья по группам" -> "Все друзья из групп" (awkward).
- `prefs.about.sourcesBefore`: "османский рисм" -> "начертание Усмани". In Russian "османский" means Ottoman.

### 2. Needs native review
1. `groups.kinds.sesama_jenis` "Один пол" and its hint. See the cross-language flag. The obvious alternative "однополый" is worse in Russian.
2. `journal.categories.diri` / `missions.categories.diri` "Нафс". In Russian Muslim usage "нафс" is the lower self/ego, so as a deed category ("Self") it may sound odd or negative.
3. Reflection terms are inconsistent: "Размышление", "Мухасаба" (unfamiliar to many readers), "Самоанализ" (hub). Consider one term with "мухасаба" in parentheses.
4. "Челленджи/челлендж" is an anglicism used throughout, instead of "Испытания/Вызовы". It is common in Russian apps.
5. `prefs.onboarding.namePlaceholder` "Раб Аллаха". It is the standard Muslim phrase but "раб" can sound harsh to some readers.
6. Levels (`missions.levels.*`) and remaining badge titles use masculine forms ("Начинающий", "Усердный", "Утвердившийся"). They agree with the masculine noun "уровень", so they are fine in context, but not neutral if shown alone.
7. `journal.screen.uzurHint` "менструация". Direct; "месячные" is softer.
8. `missions.points` "{n} б." is an abbreviation that is correct for all numbers but terse.
9. `provision.title` "Запас на сегодня". "Припасы/Провиант" would be closer to "azık/zād".
10. `missions.levels.6` "Уверенный".
11. Transliterations ("Альхамдулиллях", "Хаййа ‘аля-с-салях", "Джума") follow common Russian-Muslim spelling.

### 3. Overall confidence
Medium-high. The fixes address real grammar and gender issues. The remaining Russian is fluent and the terminology is mostly standard.

Extra (Job A): translated. I used "джазакумуллаху хайран" as in the English, and "закят и садаку" as in the main file. Medium-high confidence.
