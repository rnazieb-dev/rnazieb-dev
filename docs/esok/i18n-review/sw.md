# i18n review: sw, ha, so, yo, hi

Reviewer: Claude (language model, not a native speaker of any of these). Scope: Job A (new `extra/<code>.ts`, registered by the lead) and Job B (review of `locales/<code>.ts` against English). Placeholders, keys and array lengths verified programmatically (0 mismatches in locales and extra files). `tsc --noEmit` shows no errors in these files.

## Yoruba (yo) — lowest confidence

### Fixes applied
| Key | Old | New | Why |
|---|---|---|---|
| journal.screen.deleteTitle, journal.ledger.deleteTitle | Paá àkọsílẹ̀ yìí rẹ́? | Pa àkọsílẹ̀ yìí rẹ́? | Pronoun "á" duplicated an explicit object; ungrammatical |
| journal.vault.deleteTitle | Paá iṣẹ́ rere àṣírí yìí rẹ́? | Pa iṣẹ́ rere àṣírí yìí rẹ́? | Same |
| journal.screen.weekdays, calendar.weekdays | Ìsẹ́ | Ìṣẹ́ | Tuesday is Ìṣẹ́gun (ṣ with underdot) |
| missions.provision.title, hub.items.provision | Èsè òní | Ìpèsè òní | "Èsè" is not a recognisable word for "provision"; ìpèsè = provision/preparation |
| salat.names.zuhur | Ayila | Zuhr | "Ayila" looks coined and is not a known Dhuhr name; Arabic-derived Zuhr is recognisable (see risk list) |
| groups.report, groups.feed.reportTitle | Fi ẹ̀sùn sùn | Fi ẹ̀sùn kàn | "sùn" = sleep; the collocation for accuse/report is "fi ẹ̀sùn kàn" |
| prefs.onboarding.nameHint | orúkọ àpèjẹ ("feast name") | orúkọ mìíràn tí kì í ṣe orúkọ gidi rẹ | "àpèjẹ" = feast, wrong for pseudonym |
| prefs.onboarding.adab2After | ní àìyípadà ("unchangingly") | gẹ́gẹ́ bí ètò àkọ́kọ́ | Meant "by default" |
| journal.ledger.form.willHint | bá ọ̀jọ̀gbọ́n sọ̀rọ̀ | bá onímọ̀ sọ̀rọ̀ | ọ̀jọ̀gbọ́n = professor, not "expert" |

### Needs native-speaker review (ranked by risk)
1. **Prayer names** salat.names.* (Subhi, Zuhr, Asri, Magrib, Iṣai): author-chosen/coined forms, I cannot verify the established Yoruba Muslim spellings and tone marks. These appear in tabs/notifications. Highest visibility.
2. **Níyà / niyyah** (journal.screen.niyyah, morningNiyyah, reflection.niyyahTitle, adab1Before, shareHint, hub): "níyà" can be read as "ní ìyà" (has suffering). Yoruba Muslims commonly write the loan "niyyah"; recommend native decision.
3. **Weekday abbreviations** journal.screen.weekdays / calendar.weekdays (Àìk, Ajé, Ìṣẹ́, Ọjọ́r, Ọjọ́b, Ẹtì, Àbá): invented truncations; Ọjọ́r/Ọjọ́b are 4 characters in a 7-column grid; Muslims call Friday Jímọ̀ not Ẹtì. Also "Ìṣẹ́" collides with ìṣẹ́ (poverty).
4. **Wásíyyà / amaana** (wasiat, amanah): tone marks and spelling of Arabic loans not verified.
5. **Ọjọ́ àwáwí** (uzur): "àwáwí" often means a pretext; a "valid excuse" connotation may be lost.
6. **Tab labels** tabs.journal = "Ìwé" (book, ambiguous) and tabs.missions = "Iṣẹ́" (work/job): too generic; consider clearer short words.
7. **Dàbínù** (date fruit, sedekah hint): unsure this is the right word for dates.
8. **Ìṣírò ara ẹni** (muhasabah / hub reflection) vs **Àṣàrò** (reflection): inconsistent use for the same concept.
9. **Dí i lọ́nà** (Block): literal "obstruct his way"; "Dènà" may be the standard UI term.
10. **Ẹrú Allah** (placeholder "Hamba Allah"): "ẹrú" = slave; theologically fine, tone may feel strong.
11. **Ìforúkọsílẹ̀ ojoojúmọ́** (check-in): reads as "daily registration".
12. Minor: "Ó ń gbé e wọlé…" (loading), "Àṣà" (Standard asr), "onímọ̀ṣẹ́" (professional, helpBody), "Iná" for the Fire, mubah = "ẹ̀tọ́", "Fi ẹ̀sùn kàn" tone for a report button, sensọ̀/kọ́ńpáàsì spellings.

### Extra (Job A)
`extra/yo.ts` written. Concerns: "Iṣẹ́ pàjáwìrì" (emergency services), "ìfínúfíndọ̀ṣe" (voluntary), "owó ilé-ìtajà áàpù" (store fees), "Laini" (helpline loan) and general tone marks.

### Overall confidence: LOW
Many Arabic loan words and coined terms with tone marks I cannot verify; sentence-level meaning is mostly sound, but Islamic terminology, tone marks and tab-sized words need a native Yoruba Muslim reader before release.

---

## Swahili (sw)

### Fixes applied
| Key | Old | New | Why |
|---|---|---|---|
| salat/hub/prefs strings (nyakati za sala, Sala, Sali kwa wakati, sala za faradhi, wakati wa sala, Sala inayofuata) ~12 strings | sala / Sala / Sali | swala / Swala / Swali | Muslim usage on the coast is "swala"/"kuswali"; "sala" is the Christian/general form |
| qibla.distance | Km {km} hadi Al-Ka‘bah | {km} km hadi Al-Ka‘bah | Unit order wrong ("Km 120") |

### Needs native-speaker review
1. **Misheni** (tabs.missions, hub, titles, badges): East African readers associate "misheni" with Christian mission stations; consider "Majukumu"/"Malengo". Tab-fits as is.
2. **Hadithi** for hadith (also "hadithi za kubuni"): "hadithi" also means "story"; confirm preferred "hadith"/"hadithi za Mtume" wording.
3. **Orodha** (groups.circle.tabs.peringkat): generic "list" for "Ranking".
4. **Akiba ya leo** (provision): "akiba" = savings; "masurufu" is closer to bekal/provisions.
5. **Roho ya muumini** in the debt hadith: "nafsi" is the usual rendering.
6. common.done = "Imekamilika" (11 chars) long for a button; "Tayari/Sawa" shorter.
7. Hijri abbreviation "H" (missions.home.hijri) vs "A.H." in Swahili.
8. "Hauko peke yako": colloquial negative form (standard "huko").

### Extra (Job A)
`extra/sw.ts` written (uses swala/zaka/sadaka/thawabu/Allah consistent with the file).

### Overall confidence: MEDIUM-HIGH
Existing translation is fluent and idiomatic with standard prayer names and weekday abbreviations (Jpi, Jtt, Jnn, Jtn, Alh, Iju, Jmo); main risk is word choice around "misheni".

---

## Hausa (ha)

### Fixes applied
| Key | Old | New | Why |
|---|---|---|---|
| missions.provision.items.sedekah.title | Ba da sadaka, ko ƙanƙanuwa | Ba da sadaka, ko da ƙarama ce | "ƙanƙanuwa" not a valid word for "small" |
| prefs.about.privacy2 | fitar da share duk bayananka | fitar da duk bayananka ka kuma share su | Missing conjunction/object: "export and delete" |
| salat.disclaimer | hukuma ta hukuma | hukumar addini ta yankinka | Duplicated "authority of authority" |
| prefs.about.note5 | hukumar zakka ta hukuma | hukumar zakka da aka amince da ita | Same duplication |

### Needs native-speaker review
1. **Rukuni/Rukunoni** for "group": "ƙungiya" is the usual Hausa word for a social group; "rukuni" also reads as category and is close to "rukunin" (pillars). Pervasive, not changed.
2. **Tab labels**: tabs.journal "Littafi" (= "the Book", ambiguous) and tabs.missions "Ayyuka" (= deeds, collides with the journal's "ayyuka"). tabs.profile "Bayanin kai" is 11 chars among 6 tabs.
3. **Sirri** used for both "secret" and "Privacy" (prefs.about.privacyTitle); "Keɓantawa" is clearer.
4. **Rajistar yau da kullum** (check-in): reads as "daily register".
5. **Shigarwa** for "entry": stiff; "bayani" used elsewhere.
6. Badge titles "Ya Shiga Rukuni", "Ya Karɓi Ƙalubale" are third-person while descriptions are second-person.
7. hub.items.adhan "Sanarwar kiran sallah" (21 chars); hub.items.reflection "Duba kai" vs "Tunani" elsewhere; "Bari sanarwa" (allow notifications).
8. "Labarai" (news) for "Feed".

### Extra (Job A)
`extra/ha.ts` written. Uses zakka, sadaka, lada, Allah, "jazakumullahu khayran" as in source.

### Overall confidence: MEDIUM-HIGH
Prayer names (Asuba, Azahar, La'asar, Magariba, Lisha), weekdays, guzuri/carbi/izu/sauka and religious phrasing are standard; main doubts are the "rukuni" choice and a few tab labels.

---

## Somali (so)

### Fixes applied
| Key | Old | New | Why |
|---|---|---|---|
| groups.feed.reasonShowOff | riyo | riyaa | "riyo" means "dream" in Somali; riya (ostentation) is "riyaa" |
| missions.detail.togetherBody, groups.shared.intro | xaqiijinta asxaabta | xaqiijinta saaxiibada | "asxaab" strongly means the Prophet's Companions; "peer confirmation" should be "friends" |

### Needs native-speaker review
1. **Quudin** for "Feed" (journal, groups tab, postToFeed, privacy lines): literally "feeding"; check it is natural in a social-media sense.
2. **Astaanta** (tabs.profile): "symbol/sign" as a profile label, also used inside paths "Astaanta › Xusuusiyeyaasha".
3. **Adag** (level 5, "Steadfast"): literally "hard".
4. **Naftaada** (category "Self"): second-person possessive as a category label.
5. common.done "Waa la dhammeeyay" (16 chars) long for a button.
6. **Niyad**: also means "mood/morale" in everyday Somali; fine in Islamic context but confirm.
7. **Ammaan** used both as "praise" (shareHint) and "safe" (recovery key); context OK but ambiguous.
8. "Dhibco" used for both "points" and "dots" (calendar legend).
9. Allah vs Alle/Eebbe: file uses Allah throughout; fine for religious text.

### Extra (Job A)
`extra/so.ts` written. Some choices to verify: "Adeegyada degdegga", "Siyaasadda Asturnaanta", "dib-u-eegista culimada" (scholar review), "ikhtiyaari".

### Overall confidence: MEDIUM
Mostly accurate and uses standard Somali Islamic terms (Cibaado, Isxisaabin, Sahay, Aadaan, Dardaaran); the "riyo" and "asxaab" slips suggest more subtle lexical errors may remain.

---

## Hindi (hi)

### Fixes applied
| Key | Old | New | Why |
|---|---|---|---|
| journal.ledger.unsettle | चुकता नहीं के रूप में चिह्नित करें | बाक़ी के रूप में चिह्नित करें | Ungrammatical "X के रूप में" with a phrase |
| journal.ledger.markPaid | अदा किया के रूप में चिह्नित करें | अदा हुआ चिह्नित करें | Same |
| missions.detail.markDone | पूरा के रूप में चिह्नित करें | पूरा हुआ चिह्नित करें | Same |

### Needs native-speaker review
1. **तोशा** (missions.provision.title, hub.items.provision "आज का तोशा"): literary Urdu word for travel provisions; many Hindi readers will not know it. Consider a plainer phrase.
2. **Register mix**: Urdu-origin Islamic vocabulary (नमाज़, ज़िक्र, सवाब, इख़लास) alongside Sanskritised UI terms (प्रविष्टि, सत्यापन, निमंत्रण, प्रदर्शित नाम, सूर्योदय). Intentional or not, confirm target audience (Muslim Hindi/Urdu readers vs general Hindi).
3. **उपनाम** (nickname in nameHint): also means surname in Hindi.
4. **इशा** vs ईशा spelling, **सूरतें** vs सूरह plural, **हि.** for AH.
5. **मिशन** (missions): fine in Hindi, but English loan.
6. common.done "पूरा" and "आख़िरी पढ़ा के रूप में चिह्नित करें" (quran.markRead) are slightly stilted.

### Extra (Job A)
`extra/hi.ts` written ("जज़ाकुमुल्लाहु ख़ैरन" spelling; "उलमा" for scholars).

### Overall confidence: HIGH (medium-high on nuance)
Standard Urdu-register Islamic terminology, correct hadith phrasing, gender-neutral forms handled (रखता/रखती), concise tab labels; remaining items are register and rare-word choices.
