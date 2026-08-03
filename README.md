# Treatment Card

A free, device-local record for parents of a child in cancer treatment.

It holds the doctor's instructions, the temperatures you took at 3am, the doses you gave
and the ones you missed — then turns them into one page you can hand over at the next
visit. Nothing is uploaded. There is no account.

Built as a single HTML file with no build step, no framework, and no server.

---

## Contents

- [What this is, and what it isn't](#what-this-is-and-what-it-isnt)
- [The rules this app is built on](#the-rules-this-app-is-built-on)
- [Files and deployment](#files-and-deployment)
- [Feature reference](#feature-reference)
- [Data model](#data-model)
- [Code constraints](#code-constraints)
- [Accessibility](#accessibility)
- [Privacy](#privacy)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Deliberately not built](#deliberately-not-built)
- [Roadmap](#roadmap)

---

## What this is, and what it isn't

**It is** a notebook that adds up. A parent enters what their treating team told them —
the temperature to call about, the prescription, the routine for the night after chemo —
and then records what actually happens at home. The app organises that into a form a
clinician can read in the seven minutes they have.

**It is not** a diagnostic tool, a decision aid, or a source of medical advice. It
computes nothing clinical. Every number it reacts to was typed in by the parent because
their doctor gave it to them.

The intended user is a parent or caregiver of a child in treatment — most often
paediatric leukaemia — in the long home phase where most of treatment actually happens.
The secondary reader is the treating team, who sees the generated report.

---

## The rules this app is built on

These are not preferences. They are the constraints that keep the app safe, and they
have survived several rounds of pressure-testing. **If you change one, change it
knowingly.**

1. **The card holds instructions; it never supplies them.**
   Every threshold — fever temperature, oxygen floor, pulse ceiling — is entered by the
   parent from what their team said. The app ships with no clinical defaults it invented.

2. **Nothing stands between a frightened parent and the phone call.**
   The danger bar is the first element in the DOM, sticky above every tab, present on
   every screen. The danger modal has no input fields. There is no triage form, no
   "answer four questions first". A report step in an emergency is a delay, and a delay
   is the harm.

3. **No score, no percentage, no streak.**
   Adherence is recorded, never graded. The moment a parent sees "87% this month", an
   honest record of a missed dose becomes something to protect. The daily care list has
   ticks and no total, by design.

4. **Lab values are stored, never interpreted.**
   Blood counts are copied in by hand for the parent's own reference and labelled in the
   report as family-transcribed. The app draws no reference ranges, applies no
   colour-coding of "good" or "bad", and offers no trend interpretation.

5. **User-defined protocols carry provenance and go stale.**
   A saved routine must record who gave it and when. After 30 days the card flags it and
   asks the parent to confirm it is still current. A stale protocol executed confidently
   is the main failure mode of this feature.

6. **Protocols schedule observation only.**
   They can say *check the temperature every two hours and look at the line site*. They
   cannot encode a dose, a dose change, or an instruction to wait. The danger path always
   outranks a running protocol.

7. **No LLM gives clinical guidance.**
   Not shippable (any API key in a static file is extractable), and not appropriate — a
   model with no access to the protocol, the counts, or the team should not be answering
   "my child vomited their methotrexate, what now?"

8. **Emotional content never sits in front of the record.**
   Encouragement is derived from the day's actual data, appears after it, and is never
   scheduled cheer that could fire on the worst morning. The app never addresses the
   child directly.

9. **Colour is never the only signal.**
   Dose states carry text labels, shapes, and — in colour-blind-safe mode — glyphs. The
   printed dose calendar varies block *shape* so it survives a black-and-white printer.

10. **The record degrades, it does not disappear.**
    Every section renders independently. If one throws, the rest still draw and the
    failure is logged by name. The danger bar is static markup and survives any
    JavaScript failure.

---

## Files and deployment

```
/
├── index.html          landing page
├── app.html            the application
├── manifest.json       makes it installable
├── sw.js               offline cache — BUMP ITS VERSION ON EVERY DEPLOY
├── icons/              PWA and iOS home-screen icons
└── fonts/
    ├── plex-sans-400.woff2      plex-mono-400.woff2      atkinson-400.woff2
    ├── plex-sans-500.woff2      plex-mono-500.woff2      atkinson-700.woff2
    ├── plex-sans-600.woff2      plex-mono-600.woff2
    └── plex-sans-700.woff2
```

Static hosting only — Vercel, Netlify, GitHub Pages. No build, no environment variables,
no server.

### Values to set before sharing

| File | Line near the top of `<script>` | Points at |
|---|---|---|
| `index.html` | `var APP_URL = "./app.html";` | the application |
| `app.html` | `var ABOUT_URL="./index.html";` | the landing page |
| both | `FEEDBACK_WHATSAPP` / `FEEDBACK_EMAIL` | where feedback goes |

The URLs work as-is with the layout above. Feedback is hidden until set.

See **DEPLOY.md** for the full step-by-step, written for an iPad.

### Installing as a standalone app

`manifest.json` and `sw.js` make it a real PWA: home-screen icon, full screen with no
address bar, and a cold start that works with no signal. Android and desktop Chrome get
a native install prompt; iOS shows Share → Add to Home Screen instructions instead,
because Apple provides no prompt.

**The one maintenance rule:** bump `VERSION` in `sw.js` on every deploy. The cache is
served first, so without a bump returning users keep the old build.

### Fonts

Self-hosted, latin subset, ~145KB total. Plus Jakarta Sans for interface text, IBM Plex Mono for every number, Atkinson Hyperlegible on demand. Uploaded once and never touched again. If the
`fonts/` folder is missing the stack falls back to the system UI font — the app still
works, it just looks different. Nothing is requested from Google.

---

## Feature reference

### Today

The screen a parent opens at 3am. Everything here answers "what is happening now".

- **Four tiles** — doses given of due, last temperature (red if over the limit), readings
  taken today, next appointment.
- **Careful week banner** — appears automatically in the days after a recorded injection.
  Shows day *n* of *m*, the precautions the family recorded, and a counter of meals
  cooked ahead. In the prep window beforehand it shows the getting-ready checklist instead.
- **Treatment journey** — the phases the team named, with the current one marked. Hidden
  until phases are entered.
- **Observation strip** — a 24-hour ruled chart of today: a tick for every reading (taller
  and red if over the doctor's limit), dose markers below as shapes, a dashed "now" line.
- **Due now** — outstanding doses, overdue ones flagged, one tap to mark given.
- **Daily care list** — the ordinary things, ticked. No total.
- **Eating and drinking** — appetite, meals, fluids in 50ml steps. Recorded, not targeted.
- **End of day** — a reflection built from the day's real doses and readings, with an
  honest line chosen by what actually happened.
- **For you** — one quiet self-care focus for the caregiver. No streaks.

### Monitor

- **Protocols** — build a named routine from what the doctor said: interval, which
  measurements, and a checklist to confirm each round. Provenance required. One tap to run.
- **One-off session** — interval plus measurements, no saving.
- **Past sessions** — with breach counts.

Readings crossing a threshold log an event and open the danger pathway immediately.

### Medicines

- Today's slots with **Given / Missed / Vomited**. A missed or vomited dose asks what got
  in the way; nothing scolds.
- The prescription list.
- **Dose reminders** — writes the whole schedule into the phone's calendar as recurring
  events. Lead time, an end date, discreet labels.

### Records

- **Look back at a day** — everything from one date assembled together: doses with
  reasons and who logged them, readings with protocol checks, symptoms, blood counts,
  and the careful-week day if applicable. Copyable.
- **Treatment phases** — name and date each phase your team gave you.
- **Daily care list editor**.
- **Injection cycles** — date, careful days after, prep lead time, repeat interval.
- **Steroid days** — an optional window on an injection cycle. If the team told the
  parent to expect behaviour changes (hunger, mood, sleep) for a set number of days
  after the LP, they enter that here in the team's own words. During the window the
  Today screen prompts appetite and how-they-seem each day, framed as expected and
  passing, and the report sums up how the course went — counts, never a score, and no
  drug claims the app has no business making.
- **The careful week** — editable precautions, presented as prompts to confirm with your
  team rather than instructions.
- **Getting ready** — the prep checklist.
- **Message for relatives** — editable wording with `{child}`, `{date}`, `{until}`
  placeholders, ready to share. Rewrite it in any language without touching code.
- **How they seem** — a five-level record of behaviour with an optional note. Behaviour
  often shifts before anything measurable does, and "not herself today" is real
  information for the team. Plain words rather than emoji, since it goes into a report.
- **Backdating** — the Today screen has "Enter for an earlier day". Doses, food, the
  care list and how-they-seemed then save under the chosen date with a matching
  timestamp, and a reading can be given its own past date and time. Never a future date.
- **Symptoms** with severity, **blood counts**, **weight and height**, **appointments**,
  **questions for the doctor**.

### Reports

- Pick a period (since last visit / 7 days / 30 days / all) and toggle nine sections.
- **Generate** produces a plain-text preview, a styled printable document, share, or copy.
- The printed report includes a **dose calendar** — one square per day per medicine,
  showing the *pattern* of missed doses — and a **temperature chart** with the doctor's
  own limit drawn as a dashed line.
- **Mark a visit** resets the period so the next report covers only what followed.
- **Reminders** for refills, tests and appointments as calendar events.

### Settings

Doctor's limits, the basics, caregivers, display mode, milestones, reminder-label privacy,
text size, contrast, letterforms, colour-blind-safe palette, on-screen privacy, the
glossary, and backup.

---

## Data model

Everything lives in one `localStorage` key, `treatmentcard3`. Older keys
(`treatmentcard2`, `treatmentcard`) are read once and migrated forward. New fields merge
in via `Object.assign` on load, so updating the app never destroys an existing record.

| Key | Holds |
|---|---|
| `child` | name, hospital, emergency phone |
| `start`, `total` | treatment start timestamp, expected length in days |
| `caregivers`, `cg` | caregiver names, index of the active one |
| `th` | the doctor's thresholds — temp, unit, spo2, pulse, free-text note |
| `meds` | prescription: name, dose, times, days, instructions |
| `doses` | one record per slot per day: status, timestamp, caregiver, reason |
| `sessions` | monitoring sessions with readings and protocol reference |
| `events` | threshold breaches |
| `protocols` | user-defined routines with provenance and review date |
| `symptoms`, `labs`, `growth`, `appts`, `questions` | records |
| `phases` | named treatment phases with start dates |
| `cycles` | injection dates, careful days, prep lead, repeat interval |
| `careList`, `prepList`, `prepState`, `mealsReady` | careful-week content and per-occurrence state |
| `checks`, `checkState` | daily care list and per-day ticks |
| `food` | per-day appetite, meals, fluids |
| `visitorMsg` | editable message for relatives |
| `medRem` | reminder lead time and end policy |
| `a11y` | scale, contrast, colour mode, letterforms, name visibility |
| `rep` | report period, section toggles, "prepared for" |
| `lastVisit`, `setup`, `msSeen`, `msOn`, `mode`, `discreet`, `care` | state flags |

Backup exports this object as JSON. Import merges it back.

---

## Code constraints

The app is edited on an iPad through the GitHub web interface. There is no local build
environment, so the code deliberately avoids anything requiring transpilation:

- `var` declarations, `function(){}` expressions
- **No** arrow functions, template literals, optional chaining, `async`/`await`
- **No** `fetch` — `XMLHttpRequest` if a network call is ever needed
- Single HTML file, inline `<style>` and `<script>`
- No package manager, bundler, or framework at runtime

**One trap worth knowing.** The report generator builds a complete HTML document as a
string. Its structural tags are assembled at runtime (`docWrap`) rather than written as
literals, because any host that sanitises or re-serialises the page will see a literal
closing body tag inside the script, end the document early, and dump the rest of the code
onto the screen as text. Never reintroduce those literals.

---

## Design system

Sage-green brand, soft white cards on a tinted ground, generous radii, shadow instead of
hairline borders, fully rounded pill controls.

The stylesheet is built on tokens, not ad-hoc values: seven-step tonal ramps per hue
(`--g0`–`--g9`, `--br1`–`--br7`), a 4pt spatial scale (`--s1`–`--s9`), three elevation
levels (`--e1`–`--e3`), and two motion curves with three durations. Change a token, not
a rule.

**Motion is informational only.** Panes fade up on tab change, cards stagger in, sheets
rise, the toast overshoots slightly. Nothing on the danger path animates, and everything
is switched off wholesale under `prefers-reduced-motion`.

| Token | Light | Means |
|---|---|---|
| `--pen` | `#12726A` | brand — navigation, primary actions, active states |
| `--done` | `#17784A` | a dose given |
| `--alarm` | `#C7382E` | danger, and nothing else |
| `--hold` | `#8A5A0B` | vomited |
| `--ground` / `--surface` | `#F4F7F6` / `#FFFFFF` | page, cards |

**The brand green and the "given" green sit 1.05:1 apart by luminance.** That is
deliberate but it means hue cannot carry the dose state. Every dose chip therefore has a
text label *and* an always-on glyph (✓ ✕ ∿), the observation strip uses shapes, and the
printed calendar varies block shape. Do not remove those on the grounds that the colour
already says it — it does not.

All text passes WCAG AA on both card white and the tinted ground.

Type: Plus Jakarta Sans for interface, IBM Plex Mono for every number so columns of
temperatures and times align, Newsreader for the greeting, the milestone and the two
non-record surfaces. Newsreader is self-hosted rather than falling back to Georgia,
which many Android devices do not have.

---

## Languages

English, Kannada, and Hindi. The language control is in Settings; it swaps navigation,
section headings and everyday labels, and loads the right script font (Noto Sans
Kannada or Devanagari, fetched only when that language is active).

**Three things deliberately stay in English until a native-speaking clinician signs off
the translation: the danger-signs list, the careful-week precautions, and the glossary.**
A wrong word in "go to hospital now" is the one error in this app that could harm a
child, so those wait for a human rather than a machine. Settings says so, in the selected
language. Content the parent types — the child's name, notes — is never translated.

English is the source of truth; `I18N` in the script holds the other two, and `T(key)`
resolves them with English fallback.

---

## Accessibility

- **Text size** — normal / large / largest, scaling type *and* hit targets together.
- **Contrast** — a high-contrast palette for both light and night modes.
- **Colour-blind safe** — the Okabe-Ito palette plus a glyph on each dose state. Standard
  mode already uses shapes in the observation strip and printed grid, so hue is never the
  sole signal.
- **Clearer letters** — Atkinson Hyperlegible, designed by the Braille Institute for low
  vision. Downloaded only when enabled.
- Minimum 44px hit targets. Tabs use proper `tablist`/`tabpanel` roles. Toasts announce
  via `aria-live`. The observation strip has a spoken sentence alternative.
- Respects `prefers-reduced-motion`.

---

## Feedback

The app and landing page can open WhatsApp or email with an **empty** message. Nothing
is attached — no readings, no medicines, no name, no device identifier. Only what the
parent types travels, from their own messaging app. This is tested, not assumed.

Do not accept records if a family offers them. There is no lawful basis to hold another
family's child's health data, and the entire design promise is that you never see it.

---

## Privacy

- No account, no server, no analytics, no third-party requests of any kind.
- Data lives in one browser on one device. Clearing site data erases it.
- Sharing happens only on an explicit tap.
- **Discreet reminder labels** (default on) — calendar entries read "Medicine" or "Care
  reminder", with detail inside the event, so a lock screen does not announce the
  prescription.
- **On-screen privacy** — hides the child's name from the header while keeping it in the
  record and reports.

---

## Testing

A jsdom suite executes the shipped file and drives real user flows — 20 scenarios,
172 checks. Covered:

cold boot · setup · dosing and tallies · threshold breach and the danger path ·
protocol provenance enforcement · injection cycles and careful-week arithmetic ·
treatment phases · all record types · day view · report generation in every period and
section combination · `.ics` structure, folding, uniqueness and discreet labelling ·
backup roundtrip · accessibility modes · on-screen privacy · corrupted state ·
blocked localStorage · orphaned records · empty record · landing page.

Failure modes are explicitly tested: with `meds`, `doses` and `symptoms` set to `null`,
the app does not crash, the danger bar stays on screen, and the tabs stay usable.

**Not covered by the suite:** visual rendering, real tap-target size on device, and how
iOS Calendar and Google Calendar actually import the `.ics`. Those need a human and a
real phone.

---

## Known limitations

- **No push notifications.** A static web app cannot schedule them. Reminders are
  calendar events — if the phone is silent, they are silent. This is stated in the UI.
- **Calendar reminders are a snapshot.** Change a dose time later and existing events do
  not update; delete and re-add them.
- **`localStorage` is capped near 5MB.** Enough for years of text records. Not enough for
  photos or voice notes — see Roadmap.
- **English only.**
- **Backup carries no media** because none is stored yet. If media is added, the export
  format must change or the warning must be explicit.
- Date formats follow the device locale.

---

## Deliberately not built

Documented so nobody re-adds them without deciding to:

| Not built | Why |
|---|---|
| AI assistant / chatbot | Clinical advice from a model without the protocol or counts. Also unshippable — an API key in a static file is public. |
| Adherence score or progress % | Turns an honest record into something to protect. |
| Parent-facing lab trend charts | A downward ANC line at 2am is an interpretation the app has no business implying. |
| Emergency triage questionnaire | Puts a form between a parent and the call. |
| Insurance and finance module | A real need, but a different product with different data sensitivity. |
| In-app chat with the doctor | Needs a server this app does not have, and creates a fatal expectation: a parent types "she has a fever" and waits for a reply instead of going in. The danger path must never have a queue in front of it. |
| Clinician "online" indicator | Implies an availability nobody can guarantee at 2am. |
| Usage milestones, streaks | Engagement metrics dressed as care. |
| Stock medical photography | Cheapens it and bloats an app that must load on a rural connection. |

---

## Roadmap

- **Photos** — rash, mouth ulcer, line site. Requires IndexedDB (localStorage is too
  small), canvas compression to ~1280px JPEG, and a media-aware backup format. Highest
  clinical value per unit of complexity.
- **Voice notes** — MediaRecorder with Opus, capped at 60 seconds. Note that a recording
  of a parent describing their child is far more identifying than any number in the app;
  it must stay out of the share path.
- **Kannada, Hindi, Telugu, Tamil.** IBM Plex covers Devanagari but has no Kannada,
  Telugu or Tamil face — those need Noto Sans loaded per language. Build the font stack
  alongside the language switcher, not before it.
- **Empty-state prompts** — treatment journey and injection cycles are invisible until
  populated, which makes them undiscoverable.
- **Clinical review** of the default careful-week precautions before this reaches
  families. Neutropenic diet guidance varies by centre and some have dropped it entirely.

---

## A note on the disclaimer

Every generated report carries this, and it should not be softened:

> This report summarises caregiver-recorded observations and treatment information kept at
> home by the family. Readings were taken by parents, not by a nurse, and blood counts were
> copied by hand from hospital reports. It is intended to support communication with the
> treating team and is not a clinical assessment.
