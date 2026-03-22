# GlowLog: Product Brief for AI Development Agent

---

## 1. Vision & Mission

### What GlowLog Is

GlowLog is a skincare logging and routine tracking app built on a single founding conviction: the people who care most about their skin deserve tools that are honest with them. It is a personal skin diary, a routine manager, and a pattern-recognition engine — all in one app that never holds core functionality hostage behind a paywall.

GlowLog exists at the intersection of two user needs that competitors have consistently failed to serve simultaneously: **the need for flexible, intelligent routine management** (scheduling actives correctly, layering products safely, building habits) and **the need to understand what is actually working** (correlating skin outcomes with products, consistency, and environment). Today's users are forced to choose between an app that tracks well but doesn't analyze, or one that promises AI insights but charges immediately and delivers little. GlowLog refuses that tradeoff.

### Who It Serves

GlowLog is built for skincare enthusiasts aged 18–40 who are managing multi-step routines, navigating active ingredients like retinol and AHAs, or trying to understand why their skin behaves the way it does. This includes K-beauty followers tracking 10-step routines, ingredient-conscious consumers who read every INCI list, and beginners who feel overwhelmed by conflicting advice and don't yet know which products are helping or hurting. The app is primarily aimed at iOS users in the US, UK, Australia, and South Korea — markets where skincare literacy is high and app competition is fierce.

### Why It Must Exist

The core market insight is this: **the skincare app category has a trust problem, not a feature problem.** The top 10 competitors in this space have collectively accumulated thousands of App Store ratings, yet their most common one-star reviews share identical complaints — surprise charges, paywalls appearing after 10 minutes of use, scheduling that only supports AM/PM (not the every-3-days cycle that retinol actually requires), and product databases that don't recognize Korean, indie, or niche brands. Users keep downloading and abandoning these apps, not because they don't want a skincare tracker, but because every app they try eventually disappoints them in a way that feels like betrayal.

The competitive analysis of 10 apps confirms this pattern at scale. Apps with the highest ratings — Skan (4.76), SkinSort (4.73), Skin Bliss (4.70) — still carry significant documented flaws: Skin Bliss has 8 identified flaws and 4 identified gaps; SkinSort has 5 flaws and 3 gaps; Routinely has 4 flaws and 2 gaps. Even the top-rated apps are failing users in measurable ways. The category has approximately 100,000–200,000 active users based on rating volume, and a meaningful fraction of them are actively searching for something better.

GlowLog's mission is to be the app that earns trust first and monetizes second — and to prove that these two things are not in conflict.

### The Core Differentiating Thesis

Most skincare apps treat their free tier as a funnel trap — just enough functionality to get users invested, then a paywall before they see value. GlowLog inverts this: the free tier is the product. It is permanently complete for core use. Premium unlocks depth for power users who have already experienced genuine value. This model is not charity — it is a calculated strategy. In a category saturated with betrayal, radical honesty is a durable competitive advantage.

---

## 2. User Personas & Their Problems

### Persona 1: Maya — The Active Ingredient Juggler

**Who she is:** Maya is a 27-year-old marketing professional in London. She runs a 7-step AM and PM routine that includes retinol (used every 3 nights), a vitamin C serum (AM only), and an AHA exfoliant (once weekly). She follows four skincare subreddits, watches YouTube dermatologists religiously, and considers herself an informed consumer. She has tried three competitor apps and abandoned all of them.

**Frustrations with existing solutions:**
- No competitor app lets her schedule retinol on a "use every 3 days" cycle. They all offer AM/PM toggles or daily reminders — which is useless for actives that must be cycled to avoid over-exfoliation.
- She has been charged without clear consent by at least one app after a free trial she thought she cancelled.
- Ingredient conflict warnings in competitor apps are either absent or so vague ("consult a dermatologist") that they provide no actionable guidance.
- She has manually rebuilt her routine in three different apps after switching, which is time-consuming enough to make her reluctant to try new tools.

**What success looks like for Maya:** She opens GlowLog, sees that tonight is a retinol night (not a vitamin C night, not an AHA night), knows exactly which products to apply and in what order, and receives a plain-English explanation of why vitamin C and retinol shouldn't share the same session. After 60 days, she sees a correlation between her consistency with the retinol cycle and a measurable improvement in her logged skin condition scores. She pays for Pro because the pattern data genuinely helped her — not because she was pressured.

**Day-in-the-life scenario:** It's 9:30 PM on a Thursday. Maya opens GlowLog and sees her PM routine for tonight. The scheduler shows this is her retinol application night (Day 3 of her 3-day cycle). The routine builder has already arranged her products in the correct layering order: hydrating toner → hyaluronic acid serum → retinol → moisturizer → occlusive. There's a small flag next to retinol: "Not compatible with your AHA on the same night — your AHA is scheduled for Saturday." She completes the routine, logs her skin condition as "slightly dry, no breakouts," and closes the app. That's all. It took 45 seconds.

---

### Persona 2: Priya — The Overwhelmed Beginner

**Who she is:** Priya is a 21-year-old university student in Sydney. She started a skincare routine three months ago after a breakout spiral triggered by stress and a new cleanser. She owns six products bought based on TikTok recommendations and has no idea if they work together or are causing her more harm than good. She tried one competitor app, hit a paywall within 10 minutes, and uninstalled it. She now Googles every ingredient question individually.

**Frustrations with existing solutions:**
- Every app she finds feels like it was built for someone who already knows what they're doing. The onboarding assumes familiarity with terms like "pH," "INCI list," and "actives."
- The paywall-on-first-use model has burned her once already. She has zero tolerance for it now.
- Ingredient information she finds online is contradictory — one source says niacinamide and vitamin C don't mix, another says it's fine. She doesn't know who to trust.
- She doesn't know if her current routine is causing her breakouts or helping them, because she's never tracked it.

**What success looks like for Priya:** She adds her six products to GlowLog without needing to know anything technical. The app tells her in plain language that two of her products have a potential interaction and explains why in terms she can understand. She builds a simple routine, sets a daily reminder, and starts logging. After four weeks, she sees that her skin condition scores are improving on weeks she stays consistent and dipping on weeks she skips. She doesn't upgrade to Pro for months — and that's fine, because the free tier is doing exactly what she needs.

**Day-in-the-life scenario:** Priya is adding her new niacinamide serum to GlowLog. She scans the barcode — the product is found instantly. The app shows her the ingredient list and flags that niacinamide at high concentrations can reduce vitamin C efficacy at low pH. The explanation reads: "Your Vitamin C serum works best in an acidic environment. Niacinamide can reduce its effectiveness slightly if used at the same time — consider using them in different sessions (vitamin C in the morning, niacinamide at night)." No jargon. No paywall. She adjusts her routine accordingly. For the first time, she feels like she understands what she's putting on her face.

---

### Persona 3: Ji-won — The K-Beauty Enthusiast

**Who she is:** Ji-won is a 33-year-old UX designer, Korean-born and currently living in Toronto. She maintains a 10-step K-beauty routine and travels internationally 4–5 times per year for work. She owns 40+ products, many of which are Korean brands that Western app databases have never heard of. She has been burned by apps that couldn't find her products, forcing her to either skip tracking them or rebuild her entire product list every time she switched apps.

**Frustrations with existing solutions:**
- Western skincare databases don't include most of her products. When an app can't find a product, it either crashes, shows no result, or makes her feel like her entire skincare practice is invalid.
- Timezone-crossing travel completely breaks her reminder schedules. Apps don't understand that crossing the international date line mid-routine-cycle doesn't mean she missed a day.
- No app has let her export her complete routine history in a format she can keep as a backup or share.
- She can't find an app worth recommending to her large social following — the flaws always surface within days.

**What success looks like for Ji-won:** Every one of her 40+ products is in GlowLog — most found via barcode scan, the rest entered manually in under a minute each. When she travels to Seoul, her reminders adjust to local time without her touching a setting. Her Skin Story after 90 days shows a clear pattern: her skin performs better in Seoul's humidity than Toronto's winter air, correlated with humidity data the app pulled automatically. She recommends GlowLog to her community before she even upgrades to Pro, because the free tier already solved problems no other app had.

**Day-in-the-life scenario:** Ji-won is in Toronto, leaving for Seoul in two days. She opens GlowLog and checks her routine schedule. The app shows that her weekly essence application is due in 3 days — which, accounting for her travel timezone shift to KST (+14 hours from EST), will actually land on the right calendar day in Seoul. She doesn't need to do anything. While packing, she scans three new products she just received from a Korean brand. Two are found in the community database (other users have already added them). One isn't — so she photographs the ingredient list, reviews the AI-extracted ingredients, corrects one romanization error, and saves the product. Total time: 90 seconds.

---

### Persona 4: Sam — The Consistency Seeker

**Who he is:** Sam is a 38-year-old teacher in Chicago managing rosacea and sensitivity. He is not a skincare enthusiast — skincare is just something he has to manage carefully or his skin triggers a visible flare. He tried BasicBeauty and lost a 60-day streak due to a bug, which destroyed his motivation completely. He wants something calm, forgiving, and clinically useful — an app that helps him understand his triggers without making him feel like he failed when he misses a day.

**Frustrations with existing solutions:**
- Streak systems are punitive, not motivational. Losing a 60-day streak to a bug felt worse than losing it to genuinely forgetting.
- Apps that focus on aesthetics and "glowing skin" messaging don't speak to him. He's managing a medical skin condition, not optimizing for Instagram.
- He has no way to connect environmental triggers (cold weather, wind, indoor heating) to his flare patterns. Everything is manual guesswork.
- Premium upsells appear too early and too aggressively, making him feel like the app is not on his side.

**What success looks like for Sam:** GlowLog gives him a simple, calm interface where he logs his two-product routine and his daily skin condition (scale of 1–5 across redness and sensitivity) without any friction. The streak tracker shows him his consistency percentage, not a number he loses catastrophically. After 8 weeks, his weekly skin summary shows a clear correlation between low-humidity weeks (dry Chicago winter air) and his redness scores spiking. He has evidence to show his dermatologist. He upgrades to Pro for the advanced environmental correlation — because it proved its value first.

**Day-in-the-life scenario:** It's a Monday evening in January. Chicago is at 15% humidity outside and the heating is running constantly. Sam opens GlowLog, marks his simple PM routine as complete (gentle cleanser → barrier repair moisturizer — two products, no drama), and rates his skin: redness 3/5, sensitivity 2/5. The app shows his 7-day completion rate: 85%. No streak counter. No failure framing. His weekly skin summary (generated Sunday) noted that his redness scores averaged 3.4 on days when indoor humidity was below 30%, versus 1.9 on days above 40%. He screenshots it for his dermatologist appointment on Wednesday.

---

## 3. Core User Experiences (High-Level Flow)

### Flow 1: Onboarding & First Value

The onboarding experience is the most critical trust moment in GlowLog's entire lifecycle. Users arriving from competitor apps carry specific wounds — unexpected charges, paywalls on first use, databases that don't recognize their products. The onboarding must actively repair this trust before asking anything of the user.

The user's goal in onboarding is to get to their first useful moment as quickly as possible, without being asked to pay, without needing to know skincare terminology, and without feeling like their product knowledge or brand preferences are invalid.

The flow moves from a brief explanation of what GlowLog does (honest, single-screen, no animations that waste time) → optional skin context (experience level, skin type, primary concerns — all skippable, used only to calibrate ingredient explanations) → immediately into the product shelf. The first action the app guides the user toward is adding a product they already own. Not a quiz. Not a skin type assessment that gates features. Not a free trial prompt. Adding a product.

This flow connects directly into Flow 2 (Product Shelf & Entry) and then into Flow 3 (Routine Builder). By the time a user completes onboarding, they should have at least one product logged and understand that the app recognized it (or accepted it manually without complaint). That is the first value moment.

**Key decision points:** Whether to require account creation before first use or allow a "try first" mode. The app must never require payment or premium signup during onboarding. Experience level selection (beginner/intermediate/enthusiast) gates only the complexity of ingredient explanations — never features.

**What makes it feel good:** Speed. No unnecessary steps. The feeling that the app is on your side, not trying to trick you. The free tier is stated clearly and early — not buried.

**What makes it frustrating:** Any paywall, any subscription prompt, any feature that turns out to be greyed out after the user thought it was available. These must not exist.

---

### Flow 2: Product Shelf — Building Your Collection

The product shelf is the foundation everything else in GlowLog is built on. A routine cannot exist without products. Ingredient checking cannot happen without an ingredient list. Pattern analysis cannot work without knowing what the user applied.

The user's goal is to get every product they own into the app without friction, regardless of whether the product is a mainstream Western brand or a niche Korean essence they bought directly from Seoul.

The flow offers three entry points simultaneously: barcode scan, search, and manual entry. These are not a hierarchy with a preferred path — they are equally valid options presented at the same level. Barcode scan attempts a lookup against the product database and surfaces a result within 2 seconds if one exists. If no result is found, the app does not show an error — it immediately offers the manual entry path, pre-populated with any data it was able to extract (product name from barcode metadata if available). Manual entry accepts any product: name, brand, product type, and ingredient list. The ingredient list field accepts freeform INCI text — the user can copy-paste from a product website or type it out.

Products are organized by type (cleansers, toners, serums, moisturizers, SPF, treatments, etc.) on the shelf. A product can belong to multiple routines simultaneously. Editing a product's ingredient list after initial entry is always available and never requires a premium upgrade.

**Key decision points:** When a barcode scan fails to find a result, the transition to manual entry must feel seamless, not like a failure state. When a user edits a product's ingredient list, the app should offer to re-analyze conflicts for any routines containing that product.

**What makes it feel good:** The sensation that no product is "wrong" or unsupported. Every product the user cares about has a place in the app. The barcode scan feels fast and smart when it works, and gracefully falls back when it doesn't.

**What makes it frustrating:** A database that treats missing products as dead ends. Error messages that say "product not found" without immediately offering an alternative. Requiring premium access to enter a product manually.

---

### Flow 3: Routine Builder

The routine builder is where the user organizes their products into an actionable daily (or weekly, or cycle-based) practice. This is the core differentiating experience — the place where GlowLog proves it understands how skincare actually works, not just how other apps have modeled it.

The user's goal is to create a routine from their existing shelf that respects their real-world schedule — including active ingredients that cycle, morning versus evening designations, and the correct order of application.

The flow begins from the user's product shelf. They select products to include in a routine (dragging them into an ordered list, or accepting the app's suggested layering order based on product type and pH category). The routine is given a schedule: not just "daily AM" but any cycle the user needs — every day, every 2 days, every 3 days, weekly, bi-weekly, monthly, or a fully custom interval. Each routine gets a timezone-aware reminder time.

Once products are arranged, the ingredient conflict and layering guide runs automatically (using the bundled rules engine for instant results, with AI-enhanced explanation loading asynchronously). Conflicts are flagged inline, directly on the product in the routine, with a plain-language explanation and a suggested resolution. The user can dismiss a conflict flag if they choose — the app informs, it does not block.

A user can have up to 5 active routines on the free tier (AM, PM, weekly actives, travel routine, etc.). Routines can be paused without deletion — useful for users who travel, take routine breaks, or are doing a skin reset.

**Key decision points:** When a user adds two products with a known conflict to the same routine, the conflict flag appears immediately — but the user is never prevented from saving the routine. The flag is informative, not restrictive. When a routine schedule conflicts with another routine's schedule on the same day (e.g., AHA and retinol both scheduled for the same night), the app flags this proactively.

**What makes it feel good:** The routine builder behaves like a knowledgeable friend, not a gatekeeper. It suggests good choices and flags bad ones, but always lets the user decide. The layering order suggestion saves real cognitive work — the user doesn't need to remember whether their vitamin C goes before or after their niacinamide toner.

**What makes it frustrating:** A scheduler that only offers AM/PM toggles. An ingredient guide that vaguely says "may interact" without explaining what that means or what to do about it. Any routine feature that requires premium access.

---

### Flow 4: Daily Routine Completion & Skin Logging

This is the highest-frequency interaction in GlowLog — the one users will perform 5–7 times per week. It must be fast, friction-free, and satisfying without being gamified in a way that punishes imperfection.

The user's goal is to mark their routine as done and optionally log how their skin feels today. The entire flow should take under 60 seconds.

The home screen surfaces today's scheduled routines prominently. A user can mark an entire routine as complete with one tap, or expand it to check off individual products (useful for days they skipped one product but used the rest). Skin condition logging is presented immediately after marking a routine complete — not as a separate navigation destination. The condition log captures: overall skin feel (1–5 scale), and specific observations (breakout, dryness, redness, sensitivity) with optional severity ratings. A free-text note field is available but never required.

Progress photos are attached to a log entry — the user can add a photo while logging, and the photo is stored privately, never shared. Free tier users have 20 stored photos permanently; photos added while on the free tier are never deleted if a user downgrades from Pro.

If a user misses a scheduled routine, the app shows a grace period window (the duration is configurable, defaulting to the next morning for PM routines and that evening for AM routines). If they log within the grace period, no streak is affected. If they miss entirely, the streak shows a recovery notation rather than resetting to zero.

**Key decision points:** Whether to prompt for skin logging after every routine completion or allow users to set their own logging frequency. The default should be "after every completion," but users who find it repetitive can switch to "weekly summary only." The grace period logic must be clearly explained to users so they understand why a missed day didn't break their streak — this transparency builds trust.

**What makes it feel good:** Completion feels rewarding without being manipulative. The streak tracker shows consistency percentage over a rolling period, not just a raw count that resets catastrophically. Skin logging feels like a quick check-in, not a medical form.

**What makes it frustrating:** A routine completion flow that takes more than 60 seconds. A streak counter that resets to zero because of a timezone bug. A skin logging form with mandatory fields.

---

### Flow 5: Skin Story — Pattern Discovery

This is GlowLog's analytical payoff — the feature that transforms logged data from a diary into a decision-making tool. It is where users move from "I've been tracking" to "I understand what's happening with my skin."

The user's goal is to see clear, honest patterns that connect their skin condition scores to their product usage, routine consistency, and environmental factors — and to use those patterns to make better decisions.

The Skin Story is generated weekly (on the free tier, a simplified statistical summary with top 3 observations; on Pro, a full AI-generated correlation analysis with environmental data). It is surfaced as a weekly card on the home screen, not buried in a separate analytics tab. The weekly summary identifies what changed this week compared to the prior week, which products appeared most consistently on "good skin" days, and what the overall trend looks like over the past 30 days.

Charts visualize skin condition scores over time, overlaid with routine completion rate. Environmental data (UV index, humidity) appears as a secondary overlay on Pro tier. The correlation engine does not require facial scanning — it works entirely from the data the user has explicitly logged.

Users can tap into any data point to see which log entries contributed to it. The transparency of the data model is itself a feature — users should always be able to trace a pattern observation back to the raw logs that generated it.

**Key decision points:** When a user has fewer than 7 days of logged data, the Skin Story should acknowledge that patterns are not yet meaningful and encourage continued logging rather than generating speculative insights. When the AI-generation process fails, the most recent successfully generated summary is shown with a clear timestamp — never an empty state or an error screen.

**What makes it feel good:** Seeing a real pattern — "your skin was significantly better on the 5 days you completed your full routine compared to the 2 days you skipped" — feels like a genuine discovery. The data feels like it's working for the user, not being mined by the app.

**What makes it frustrating:** Insights that are too vague to act on ("your skin improved this week!"). Insights that require more data than the user will realistically generate. Any paywall appearing in the middle of a pattern the user was about to understand.

---

## 4. Feature Specifications

### Feature 1: Flexible Recurring Routine Scheduler

**What it does from the user's perspective:** The scheduler lets a user set any recurrence pattern for a routine — not just "daily AM" or "daily PM," but every 2 days, every 3 days, weekly on specific days, bi-weekly, monthly, or a fully custom interval defined in days. Each routine has its own independent schedule. Reminders fire at a user-specified time and automatically adjust when the user crosses timezones. A routine scheduled for "every 3 days at 9 PM" in New York continues to fire at 9 PM local time in London without any user intervention.

**Why it matters:** This feature addresses the single most-cited scheduling frustration across the competitor landscape. Active ingredients like retinol, AHAs, and BHAs are never used daily — dermatologists consistently recommend cycling them. An AM/PM toggle is not a cycle scheduler. Maya cannot use retinol every 3 days in any competitor app. Ji-won cannot maintain her 10-step K-beauty cycle schedule while traveling without manually adjusting her reminder times. This feature is the one that makes GlowLog feel like it was built by someone who actually uses skincare.

**Where AI enhances the experience:** AI is not the primary driver of this feature — the scheduling logic itself is rule-based and deterministic. AI enhances the experience in the setup phase by suggesting appropriate schedules for product types: if a user adds a retinol to a routine, the app proactively suggests an every-2-or-3-day schedule and explains why. If a user schedules AHA and retinol on the same rotation, the ingredient conflict engine flags that these shouldn't land on the same night.

**Fallback behavior when AI is unavailable:** The scheduling feature is fully functional without any AI connection. The AI-powered schedule suggestion is a nice-to-have enhancement on routine creation — if it fails, the user simply sets their own schedule without a suggestion. The reminder firing, streak tracking, and timezone adjustment are all handled by on-device logic and require no network connection.

**Edge cases and handling:**
- *Daylight saving time transitions:* When a user's local timezone shifts for DST, reminders must adjust gracefully. A 9 PM reminder should remain at 9 PM local time, not shift to 8 PM or 10 PM.
- *International travel with rapid timezone change:* If a user crosses from EST to KST (14-hour difference) mid-cycle, the app should honor the local time and not trigger two reminders in the same local calendar day or skip one entirely. A grace period buffer of 12 hours prevents false "missed" entries during travel days.
- *Pausing a routine mid-cycle:* When a user pauses a routine (e.g., they're on vacation and not using their usual products), the cycle counter pauses — it does not mark every missed day as a skip. When the user resumes, the cycle continues from where it left off.
- *Routine schedule conflicts:* If two routines are both scheduled for the same night and contain conflicting ingredients (retinol in one, AHA in the other), the scheduler flags this on save: "These two routines are both scheduled for tonight and contain ingredients that shouldn't be used together. Consider shifting one routine to a different night."
- *Deleting a product that's in an active routine:* The product is removed from the routine with a notification to the user. The routine does not silently break.

---

### Feature 2: Shelf-First Product Entry with Barcode Scan

**What it does from the user's perspective:** Users build their product shelf by scanning barcodes, searching a product database, or entering products manually — and every path leads to the same outcome: a complete product record with name, brand, product type, and ingredient list. The barcode scanner attempts to identify the product immediately. If the barcode matches an entry in the local cache or community database, the product details are pre-populated and the user confirms. If the barcode doesn't match anything, the user is offered manual entry with any auto-populated fields the app was able to infer. No user ever sees a dead end that says "this product is not supported."

**Why it matters:** This feature is the foundation of Ji-won's and Priya's trust in the app. Ji-won's Korean beauty products don't exist in Western databases — GlowLog's manual entry path means she is never a second-class user. Priya doesn't know the INCI names of her ingredients — the barcode scan means she doesn't have to. Universal product entry is a commitment, not a marketing claim: every product any user cares about has a place in GlowLog.

**Where AI enhances the experience:** When a barcode scan fails to find a product match and the user chooses to photograph the product label instead, AI vision extraction reads the label image and populates the product name, brand, and ingredient list automatically. This AI-extracted data is always shown to the user in an editable confirmation screen before saving — the app explicitly labels it as "AI-extracted — please verify" and highlights any fields it is less confident about. Vision extraction is a convenience enhancement, not a required path.

**Fallback behavior when AI is unavailable:** The vision extraction fallback is itself a fallback to manual entry — if it fails, the user proceeds directly to the manual entry form. No user is blocked. The barcode scan fallback chain has five levels: local bundle cache → Open Food Facts API → community product database → AI vision extraction → manual entry. Manual entry is always the final, guaranteed path.

**Edge cases and handling:**
- *Duplicate product detection:* If a user scans a barcode for a product already on their shelf, the app alerts them and asks whether they want to add a second entry (useful for tracking multiple sizes or formulations) or view the existing entry.
- *Incorrect barcode match:* Product databases occasionally have barcode conflicts (especially for regional product variants). If a user confirms a pre-populated product and later discovers the ingredient list is wrong, they can edit any field at any time. Edited products are flagged as "user-verified" in the community database.
- *Incomplete ingredient lists:* Some products in the database may have partial ingredient lists. The app shows this clearly ("ingredient list may be incomplete — tap to add") and allows the user to fill in the gaps. The app never silently uses an incomplete ingredient list for conflict analysis without surfacing the incompleteness.
- *Korean/Japanese/non-Latin label text:* When AI vision extraction encounters non-Latin text, it translates and transliterates to INCI-standard names where possible, and retains the original text for fields it cannot confidently translate. The user review step is especially important for non-Latin labels.
- *Products with no ingredients listed:* Some products (tools, physical accessories) have no ingredient list. The product type selector includes non-product items, and conflict checking is simply skipped for products without ingredients.

---

### Feature 3: Ingredient Conflict Detection & Layering Guide

**What it does from the user's perspective:** When a user adds products to a routine, GlowLog automatically checks for known ingredient conflicts and suggests the optimal application order. Conflicts are displayed as inline flags on the relevant product in the routine, with a plain-language explanation ("Retinol and AHAs can cause excessive irritation when used together — consider using one in the morning and one at night, or alternating nights") and a suggested resolution. Layering order is suggested based on product type and pH category — thinner, more acidic products first, heavier, more occlusive products last. The user can accept the suggested order or drag products into any order they prefer.

**Why it matters:** This feature directly addresses the confusion that drives users like Priya to Google every ingredient combination individually. It provides the knowledgeable-friend experience — the kind of guidance that was previously only available from a dermatologist or a deeply-read skincare community. For Maya, it's the feature that makes GlowLog indispensable: the scheduler and the conflict engine together solve the two hardest problems in active ingredient management.

**Where AI enhances the experience:** A bundled rules engine (a curated JSON file of approximately 500 known conflict pairs) handles the authoritative binary detection — this runs on-device, instantly, and requires no network connection. Claude AI is called asynchronously to generate the plain-language explanation and provide nuanced context. The distinction matters: the rules engine tells the app *whether* a conflict exists (deterministic, verifiable), and AI explains *why it matters and what to do* in language calibrated to the user's experience level. A beginner gets "these two can irritate your skin together — use them on different nights." An enthusiast gets "the low-pH environment of your AHA exfoliant accelerates retinol conversion in a way that may exceed your skin's tolerance threshold."

**Fallback behavior when AI is unavailable:** When the Claude API is unavailable, the bundled rules engine continues to flag conflicts with pre-written plain-language explanations from the JSON file. The user sees a subtle indicator that "enhanced explanations are temporarily unavailable" but the conflict flags themselves are always shown. The experience degrades gracefully — less nuanced, but never absent.

**Edge cases and handling:**
- *Widely-debated conflicts (Vitamin C + Niacinamide):* Some ingredient interactions are the subject of genuine scientific debate — the old "niacinamide deactivates vitamin C" claim is now largely considered a myth at modern formulation concentrations, but users may have encountered it online and expect to see it flagged. GlowLog handles this by surfacing nuanced explanations: "Some older sources suggest niacinamide and vitamin C interact, but at modern concentrations in most products, this is unlikely to be significant. If your vitamin C serum has a pH below 3.5, you may want to apply them separately for maximum efficacy." The app does not ignore these debates — it contextualizes them honestly.
- *Unknown ingredients:* If a product's ingredient list contains an ingredient not in the conflict rules database, the conflict check proceeds for the ingredients that are recognized, and the user is notified: "X ingredients in this product were not found in our database and could not be analyzed."
- *Conflicts involving products from different routines:* The conflict checker analyzes products within the same routine session. It does not flag conflicts between a user's AM routine and PM routine (those are intentionally separate sessions). However, the scheduler conflict detection (see Feature 1) does flag when conflicting products from different routines are scheduled for the same session.
- *User overrides:* A user can dismiss any conflict flag by marking it as "I'm aware of this." The flag is saved as acknowledged, not shown again as a new warning, but remains visible in the routine details for reference.

---

### Feature 4: Skin Story Correlation Engine

**What it does from the user's perspective:** Once a user has been logging for at least a week, GlowLog generates a Skin Story — a weekly summary that connects their logged skin condition scores with their routine completion rate, product usage patterns, and environmental data. The summary identifies the top 3 patterns in their data: for example, "Your skin was clearer on days you completed your full routine (average score 2.1) versus days you skipped your PM routine (average score 3.4)," or "Your dryness scores increase consistently on days when the outdoor humidity drops below 30%." On the free tier, users receive these top 3 statistical observations. Pro users receive a full AI-generated narrative analysis with environmental overlays and month-over-month trend tracking.

**Why it matters:** This feature is GlowLog's long-term retention engine. The longer a user logs, the more valuable and personalized their Skin Story becomes. After 90 days of logging, a user's Skin Story is genuinely unique — it cannot be replicated in another app without starting the data history from scratch. This is the feature Sam has never found anywhere else: objective evidence connecting his rosacea flares to environmental conditions he can actually control (like indoor humidity or wind exposure).

**Where AI enhances the experience:** The free tier's top-3 observations are generated from database aggregates — statistical calculations that require no AI call. This is intentional: the basic pattern detection is not an AI feature, it's a data analysis feature, and it belongs in the free tier. Claude AI is engaged for Pro users to synthesize a narrative from the aggregated data, identify non-obvious correlations, and write a weekly summary that reads like a thoughtful observation rather than a statistics report. The AI does not receive photos, raw log text, or any personally identifying information — only structured numerical data: skin condition scores, routine completion flags, product usage counts, and environmental readings.

**Fallback behavior when AI is unavailable:** The free tier Skin Story is entirely rules-based and unaffected by AI availability. For Pro users, if the AI narrative generation fails, the most recently generated narrative is displayed with a clear timestamp ("Generated 8 days ago") alongside the current week's statistical observations. The user is never shown an empty Skin Story — there is always something meaningful to display.

**Edge cases and handling:**
- *Insufficient data:* When a user has fewer than 7 days of logged entries, the Skin Story section shows an encouraging placeholder that explains how many more days of logging are needed before patterns become meaningful, and what kinds of insights they can expect to see. It does not generate speculative insights from sparse data.
- *Conflicting signals in the data:* Some users' data will genuinely be noisy — they change too many variables at once for clear patterns to emerge. The Skin Story should acknowledge this honestly: "You changed 4 products this week, which makes it harder to isolate what's working. Consider introducing changes one at a time for clearer insights next week."
- *Long logging gaps:* If a user goes 30+ days without logging, their Skin Story is not invalidated — the historical data remains. The next Skin Story generation uses only the most recent period with sufficient data, and flags the gap transparently.
- *Environmental data unavailability:* If the weather data API is unavailable for a given period, the Skin Story is generated without environmental correlations, and the missing data is noted. The analysis never fabricates environmental data.

---

### Feature 5: Honest Freemium Model

**What it does from the user's perspective:** GlowLog's free tier is permanent, complete for core use, and never hides features behind trials, confusing limitations, or subscription prompts that appear on the screens users visit most often. Every user who downloads GlowLog can log unlimited products, build up to 5 routines with full cycle scheduling, check ingredient conflicts, store up to 20 progress photos (permanently — photos added while free are never deleted after downgrade), log skin conditions daily, and receive weekly Skin Story summaries with top 3 observations. Premium (GlowLog Pro at $7.99/month or $49.99/year) unlocks advanced Skin Story AI narratives, unlimited progress photo storage, data export (JSON and CSV), and advanced environmental correlation analytics. A Lifetime option at $79.99 unlocks Pro features permanently.

**Why it matters:** In a category where the most common one-star review is some variation of "charged me without warning" or "everything is behind a paywall," the honest freemium model is not just an ethical position — it is a market positioning strategy. Priya, burned by a paywall on her first experience, will not pay before she sees value. Sam, who lost motivation after a bug destroyed his streak, will not pay for potential value — only demonstrated value. The free tier exists to build genuine trust over weeks and months, and the upgrade prompt appears when and only when a user naturally encounters a Pro feature they want. There are no subscription prompts on the home screen, no "unlock" banners on core features, and no countdown timers.

**Where AI enhances the experience:** The Premium upgrade is partly about AI depth — the full Skin Story narrative is an AI-generated feature that genuinely requires AI inference costs that justify a premium tier. This is an honest value exchange: the AI feature is exclusive to Pro because it costs money to generate, not because it was artificially gated.

**Fallback behavior:** This feature is a product policy, not a technical system. There is no fallback state — the policy is the feature.

**Edge cases and handling:**
- *User downgrades from Pro to free:* All data is preserved. Progress photos above the 20-photo free limit remain in storage but new photos cannot be added until the count drops below 20 (e.g., if the user deletes some). The 20 photos that were stored while the user was on the free tier are never retroactively deleted. The app communicates this clearly before downgrade is confirmed: "Your data is safe. You'll keep all your logs, routines, and your first 20 progress photos forever."
- *User on free tier tries to access a Pro feature:* A single, non-aggressive modal explains what Pro unlocks and offers the upgrade. The modal has a clear dismiss option. It does not reappear for the same feature within 30 days. It never appears on core feature screens (home, routine completion, product logging).
- *Billing issues and subscription lapses:* If a Pro subscription lapses due to a payment failure, the user is downgraded to free tier with a 7-day grace period during which Pro features remain active. The user receives one in-app notification (not repeated daily) explaining the payment issue.
- *Lifetime purchase and future major versions:* Lifetime purchasers receive all features available at their time of purchase and all feature additions to the current major version of GlowLog. A new major version (e.g., GlowLog 2.0) may have its own pricing structure, but this is disclosed at the time of Lifetime purchase.

---

## 5. What Must Be Different (Anti-Competitor Directive)

### Problem 1: Paywalls Appearing Before Any Value Is Delivered

**The problem users face today:** Multiple competitors — including highly-rated apps with thousands of reviews — show subscription prompts within the first 10 minutes of use, before the user has logged a single product or built a single routine. Some apps use "free trial" language that obscures automatic billing. Users report being charged for subscriptions they believed they cancelled. Priya uninstalled her first skincare app because of a paywall 10 minutes in. These experiences have made the entire category toxic for first-time users.

**The correct behavior GlowLog must exhibit:** The upgrade prompt must never appear during onboarding, during the first routine build, or on any screen that a free user visits as part of their core daily flow (home screen, routine completion, product logging, skin condition entry). The premium upgrade is accessible from the settings menu and from within Pro feature previews only. The first time any upgrade prompt appears is when a user organically encounters a feature that requires Pro — and even then, it appears once, with a clear dismiss option, and does not repeat for that feature for 30 days. Billing practices must be transparent: pricing is shown in full before any payment screen, there are no auto-renewing trials without explicit consent confirmation, and subscription management is always one tap away from the settings screen.

**Why this difference is critical:** Every user who downloads GlowLog has likely been burned by a competitor's paywall. The first paywall prompt that appears too early will immediately cause uninstalls from the users GlowLog most needs to retain — the active ingredient jugglers and K-beauty enthusiasts who have been through this before and have no patience for it. Trust, once lost in this category, is not recoverable.

---

### Problem 2: Scheduling That Doesn't Understand How Actives Work

**The problem users face today:** Every major competitor in the skincare app space offers AM and PM routine slots as their scheduling model. Some add daily reminders. None offer cycle-based scheduling — the ability to schedule a routine to fire every 2 days, every 3 days, weekly on alternating days, or on a custom interval. This means Maya cannot use any competitor app to properly schedule retinol. The scheduling models in today's apps were designed for a two-step cleanser-and-moisturizer routine, not for a modern multi-active skincare practice.

**The correct behavior GlowLog must exhibit:** Every routine in GlowLog has independent scheduling. The scheduler must support: daily, every N days (where N is user-defined), specific days of the week, weekly, bi-weekly, monthly, and fully custom intervals. This is not a power-user feature — it is the baseline expectation of anyone managing actives. The scheduling interface must be simple enough for Priya to set a daily reminder for her basic routine while being flexible enough for Maya to schedule retinol on a 3-day cycle and AHA on a weekly cycle without those cycles ever conflicting.

**Why this difference is critical:** This is the feature gap that has existed in the competitor landscape long enough that it represents a genuine market opportunity. Users on skincare forums repeatedly mention that no app handles their retinol schedule correctly. Any app that solves this problem will become the recommendation in every "best skincare tracking app" thread — because it's the feature being actively requested and never delivered.

---

### Problem 3: Product Databases That Exclude International and Niche Brands

**The problem users face today:** Western-focused competitor apps treat a missing product as a problem. Their databases cover mainstream US and European brands adequately but leave Korean, Japanese, indie, and small-batch brands absent or incomplete. Ji-won cannot find most of her products. Users who scan an unrecognized barcode often see an error or an empty result with no path forward. Apps that have manual entry often bury it behind the failed scan result, requiring several taps to find.

**The correct behavior GlowLog must exhibit:** Manual entry must be a first-class path, not a last resort. It must be offered at the same visual prominence as barcode scan and search on the product entry screen. When a barcode scan fails to return a match, the transition to manual entry must be immediate and frictionless — a single tap, with any fields auto-populated from barcode metadata. Manual entry must support free-form text for the ingredient list (the user can copy-paste from any source). The app must never communicate that a product is "not supported" — only that it's "not yet in our database" and that the user can add it now. Products added manually are contributed to the community database (with the user's opt-in consent) so that the next user with the same product finds it instantly.

**Why this difference is critical:** Ji-won is GlowLog's most powerful potential advocate. She has an audience and a genuine enthusiasm for recommending products that work. But she will only recommend GlowLog if it handles her Korean products flawlessly — because that's the bar her audience will immediately test. A single "this product isn't found" dead end will cost GlowLog not just Ji-won, but her entire network.

---

### Problem 4: Streak Systems That Punish Imperfection and Break for Technical Reasons

**The problem users face today:** Sam lost a 60-day streak in BasicBeauty due to a bug. He stopped using the app immediately. This is not an isolated complaint — streak loss from timezone bugs, app crashes, and daylight saving time transitions appears repeatedly in competitor reviews across multiple apps. The streak counter, designed to motivate, becomes a source of anxiety and demotivation. When it resets to zero — for any reason — users feel punished rather than supported.

**The correct behavior GlowLog must exhibit:** GlowLog's consistency tracking must be designed to forgive imperfection, not punish it. The primary metric shown to users must be a **rolling consistency rate** (e.g., "You've completed 85% of your routines over the past 30 days") rather than a raw streak counter that resets catastrophically. A streak indicator can exist as a secondary metric for users who enjoy it, but it must never be the primary emotional signal. Grace period logic must be implemented: a missed PM routine can be logged the next morning before noon and not count as a miss. When a streak is broken, the app must show recovery progress, not a zero — "Your last streak was 60 days. You're now on a 3-day recovery streak." Timezone bugs that cause false misses must be treated as app errors, not user failures, and the app must have logic to detect and correct these automatically.

**Why this difference is critical:** Sam is the user GlowLog is most likely to retain for years — if the app earns his trust. He has a skin condition that requires long-term tracking. His data becomes more valuable the longer he uses the app. But he will abandon GlowLog the moment a motivational feature punishes him unfairly. Forgiving streak mechanics are not a nice-to-have — they are the product philosophy expressed in code.

---

### Problem 5: AI Insights That Are Vague, Misleading, or Crash-Prone

**The problem users face today:** Several competitors offer AI skin analysis features — most involving facial scanning — that produce generic results ("your skin looks dehydrated"), crash on certain devices, or generate the same insights regardless of the user's actual data. Users pay premium prices for AI features that deliver no actionable value. Skan (4.76 rating, 4 flaws, 3 gaps) and Routinely (4.68 rating, 4 flaws, 2 gaps) both exhibit forms of this failure. The AI analysis promise is one of the category's most frequent disappointments.

**The correct behavior GlowLog must exhibit:** GlowLog's AI-generated insights must be specific, traceable, and honest about their limitations. Every Skin Story observation must reference the specific data that generated it — a user must be able to tap any observation and see the underlying log entries. When data is insufficient to generate a meaningful insight, the app must say so plainly ("You've logged 4 days this week — you'll need at least 7 for reliable patterns") rather than generating a plausible-sounding but meaningless insight. GlowLog must never perform facial scanning — all analysis is derived from explicitly logged data only. AI explanations for ingredient conflicts must be validated against a deterministic rules engine — Claude explains the rules, it does not invent them. When AI is unavailable, the experience degrades to a rules-based fallback, not to an empty or broken state.

**Why this difference is critical:** Every AI feature in GlowLog represents a promise to the user. A broken or misleading AI promise is worse than no AI at all — it actively damages trust. GlowLog's competitive advantage in this space is honest, traceable insights that users can verify against their own data. An AI that hallucinates a skin analysis cannot deliver this, and must be prevented from doing so by design.

---

### Problem 6: Ingredient Information Locked Behind Premium or Absent Entirely

**The problem users face today:** Several competitors either lock ingredient checking behind premium paywalls or offer only superficial ingredient information (star ratings with no explanation) that doesn't help users understand why an ingredient matters or how to use it safely. Beginner users like Priya are left Googling every ingredient question because the app they're paying for won't explain anything.

**The correct behavior GlowLog must exhibit:** The ingredient conflict guide and layering order recommendation are permanently free. Every user — regardless of tier — can see which ingredients conflict and why. The explanation of each conflict is written in plain language, calibrated to the user's self-reported experience level (beginner, intermediate, enthusiast). When a user taps an individual ingredient to learn more, they receive an explanation that matches their level: beginners get practical guidance ("avoid mixing these on the same night"), enthusiasts get the mechanism ("the low pH environment accelerates acid conversion in a way that may exceed your skin's adaptation threshold"). This education layer is free because informed users make better decisions — and users who understand their routine are more likely to stay engaged with the app.

**Why this difference is critical:** Ingredient conflict checking is not a luxury feature — it is a safety feature. Any user managing actives like retinol or AHAs is making decisions that can materially affect their skin health. Locking safety-relevant information behind a paywall is both ethically problematic and a clear differentiator opportunity. GlowLog's commitment to free ingredient checking is one of its most defensible differentiating positions — it is both the right thing to do and the thing that no well-funded competitor has been willing to do.

---

### Solo Developer Scope Rationale

Every feature and scope decision in this brief has been made with a single constraint in mind: **one person must be able to build, ship, and maintain this app within 16 weeks and continue to operate it alone post-launch.** This is not a startup spec — it is an indie developer spec, and those are meaningfully different documents.

Several features described in the product vision were deliberately deferred to post-launch versions to keep the MVP achievable. The AI vision label extraction (photographing a product label for ingredient extraction) is a compelling feature but adds integration complexity and a non-trivial AI cost surface that is disproportionate to its MVP value — manual entry covers the gap adequately at launch. The community-moderated product database with a moderation queue requires ongoing human operational overhead that a solo developer cannot sustain while also building and supporting the app; it launches as a contribution-only system (users can submit, moderation is lightweight at small scale) and evolves into a full moderation system when volume demands it. The environmental correlation layer of the Skin Story engine is deferred to v1.1 — it requires sufficient logged data history to be statistically meaningful, and the first cohort of users will not have that history at launch. GPT Vision label scanning is deferred for the same reason: it adds cost, complexity, and a new failure mode, while manual entry is a perfectly acceptable substitute for a small user base.

What was **not** cut: the core free tier, the flexible cycle scheduler, the ingredient conflict engine, the barcode scan with manual entry fallback, and the honest freemium model. These are non-negotiable because they are the differentiation — removing any of them would produce a product indistinguishable from the competitors GlowLog is explicitly trying to replace.

**Realistic success metrics for a one-person launch:** 500 installs in the first 30 days (achievable through organic Reddit and App Store discovery). 40%+ Day-1 retention and 15%+ Day-30 retention, measured against the industry average of 25–35% and 10–15% respectively for utility apps. 3% free-to-Pro conversion by Month 6, yielding approximately $390 MRR on 2,000 active free users — a number that covers infrastructure costs and validates the monetization model without requiring venture scale. A TestFlight beta of 50–100 users before App Store submission to catch crash-level issues on real devices. These are indie metrics, not startup KPIs. They are achievable by one person and meaningful as validation signals for continued investment in the product.

# GlowLog — Product Brief: Part 2 (Sections 6–13)

---

## 6. Data & Content Requirements

### Core Data Entities

---

#### 6.1 User

**What it is:** The root entity representing a GlowLog account. Everything in the app belongs to a User.

**Attributes:**
- Unique identifier (system-generated at signup)
- Email address
- Display name (optional)
- Skin type (oily / dry / combination / sensitive / normal — user-selected at onboarding, editable)
- Experience level (beginner / intermediate / enthusiast — user-selected, affects ingredient education depth)
- Primary skin concerns (multi-select: acne, aging, hyperpigmentation, sensitivity, texture, dryness — user-selected)
- Notification preferences (enabled/disabled per routine, preferred reminder timing)
- Home timezone (stored explicitly; used for routine scheduling — separate from device timezone to handle travel gracefully)
- Subscription status (free / pro — cached locally and synced from RevenueCat on app open)
- Subscription expiry date (for grace period logic)
- Account creation date
- Last active date

**Lifecycle:** Created at signup. Skin profile updated whenever user edits their profile. Subscription status synced on app open and after any purchase event. Deleted (with all related data) on explicit account deletion — no soft-delete ambiguity.

**Relationships:** One User → many Products (their shelf), many Routines, many SkinLogEntries, many ProgressPhotos, one SubscriptionRecord.

---

#### 6.2 Product

**What it is:** A skincare product that exists on the user's personal shelf. This is always a user-specific entity — even if two users own the same physical product, each has their own shelf record. Products are the foundation from which routines are built.

**Attributes:**
- Unique identifier
- Owner (User reference)
- Product name
- Brand name
- Product type / category (cleanser, toner, serum, moisturizer, SPF, exfoliant, treatment, eye cream, oil, mist — determines layering order suggestions)
- INCI ingredient list (ordered array of ingredient names as they appear on the label)
- Known pH value (optional — entered by user or extracted from label; used to refine conflict detection)
- Barcode / UPC (optional — stored if scan was used; used for future lookup deduplication)
- Entry method (barcode-scan, manual, vision-extracted, community-sourced — affects trust tier for ingredient data)
- Vision-extracted flag (boolean — triggers "please verify" notice in UI if true)
- Product notes (free-text field — user's personal notes: "causes breakouts", "repurchase", etc.)
- Date added to shelf
- Last used date (derived from routine completion logs)
- Archive status (boolean — archived products stay on shelf but are hidden from active routine builder; never hard-deleted)

**Lifecycle:** Created when user adds a product via any entry method. Updated when user edits product details or ingredient list. Archived (not deleted) when user removes from active shelf — preserves historical routine completion and conflict analysis data. Hard-deleted only on full account deletion.

**Relationships:** One Product → many RoutineSteps (products can appear in multiple routines), many IngredientConflictResults (conflict analysis outputs reference specific products).

---

#### 6.3 Routine

**What it is:** A named, scheduled skincare routine that represents a repeating sequence of products the user applies. A user may have multiple routines (Morning, Evening, Weekly Actives, Travel Kit, etc.).

**Attributes:**
- Unique identifier
- Owner (User reference)
- Routine name (user-defined: "Morning", "PM Routine", "Retinol Nights", etc.)
- Time of day designation (AM / PM / anytime — affects dashboard ordering and reminder timing)
- Recurrence type (daily / every-N-days / specific-days-of-week / monthly / custom)
- Recurrence interval (the N in "every N days", or the specific weekdays, or day-of-month)
- Active status (boolean — paused routines don't generate reminders or streak checks)
- Home timezone (copied from User at creation; editable independently for travel scenarios)
- Reminder enabled (boolean)
- Reminder time (time-of-day for notification, stored in the routine's timezone)
- Creation date
- Last completed date
- Current streak (computed field — consecutive days the routine was marked complete within its grace period)
- Longest streak (high-water mark — never decremented)
- Grace period setting (user-configurable: 0 / 2h / 4h — allows completing a routine slightly past midnight without breaking streak)

**Lifecycle:** Created when user builds a new routine. Updated when user edits products, schedule, or name. Paused when user temporarily deactivates. Deleted on user request — routine completion history is retained for Skin Story analysis even after routine deletion (products are detached, not purged).

**Relationships:** One Routine → ordered list of RoutineSteps, many RoutineCompletionLogs.

---

#### 6.4 RoutineStep

**What it is:** A single product within a routine, at a specific position in the application order. The step captures the relationship between a Routine and a Product, including user-adjusted ordering.

**Attributes:**
- Unique identifier
- Routine reference
- Product reference
- Step order (integer — position in the application sequence; 1 = first applied)
- System-suggested order (the order GlowLog recommended based on product type; stored separately so the user's overrides are visible)
- Step notes (optional — user can annotate individual steps: "2 pumps only", "skip if skin is irritated")
- Active status (boolean — allows temporarily removing a product from a routine without deleting the step)

**Lifecycle:** Created when user adds a product to a routine. Reordered when user drags steps. Deactivated when user skips a product from a routine temporarily. Deleted when user explicitly removes a product from the routine. Cascade-deleted when the parent Routine is deleted (but the underlying Product on the shelf is unaffected).

---

#### 6.5 RoutineCompletionLog

**What it is:** A timestamped record of a user completing (or partially completing) a routine on a given day. This is the primary data source for streak calculation, Skin Story correlation, and dashboard history.

**Attributes:**
- Unique identifier
- Routine reference
- User reference
- Completion timestamp (exact datetime in UTC; displayed in user's local timezone)
- Completion status (complete / partial / skipped)
- Products applied (array of Product references from this routine's steps — captures which steps were completed vs. skipped for partial completions)
- Note (optional free-text — "skipped SPF, stayed indoors", "used less retinol")

**Lifecycle:** Created each time a user marks a routine as complete or partial. Never edited after creation (it's an immutable event log). Retained indefinitely — even if the parent Routine is deleted — because it feeds Skin Story correlation analysis.

---

#### 6.6 SkinLogEntry

**What it is:** A daily snapshot of the user's skin condition. The core input for the Skin Story correlation engine. Users log this independently of routines — it's a quick daily check-in, not tied to a specific product application.

**Attributes:**
- Unique identifier
- User reference
- Log date (date only — one entry per day per user; subsequent entries on the same day overwrite)
- Overall skin score (1–5 scale, user-selected — 1 = worst day, 5 = best day)
- Breakout severity (0–5 — 0 means none)
- Dryness level (0–5)
- Redness level (0–5)
- Sensitivity level (0–5)
- Oiliness level (0–5)
- Free-text observation (optional — "stressed this week", "tried new pillowcase", "drank more water")
- Environmental snapshot at time of log: UV index (fetched automatically from Open-Meteo if location permission granted, otherwise null), season (derived from date and hemisphere)
- Creation timestamp
- Last updated timestamp

**Lifecycle:** Created on first log for a given date. Updated if user re-logs the same day (editing a same-day entry is allowed; cross-day editing is not). Retained indefinitely for Skin Story analysis.

**Relationships:** SkinLogEntries are correlated with RoutineCompletionLogs and Product usage by the Skin Story engine — there is no hard foreign key between them, but the date-based join is the correlation axis.

---

#### 6.7 IngredientConflictResult

**What it is:** A cached analysis output representing the conflict and layering assessment for a specific combination of products in a routine. Stored to avoid redundant API calls and to surface historical conflict flags.

**Attributes:**
- Unique identifier
- Routine reference (or product-pair reference for shelf-level checks)
- Products analyzed (ordered array of Product references)
- Ingredient fingerprint hash (deterministic hash of the combined sorted ingredient lists — used as cache key)
- Conflicts detected (array of conflict objects: ingredient A, ingredient B, severity, plain-language explanation, source reference)
- Suggested layering order (ordered array of Product references with reasoning)
- Analysis source (on-device-rules / claude-api / cached)
- Analysis timestamp
- Model version used (for future cache invalidation when conflict rules are updated)

**Lifecycle:** Created after a user saves or modifies a routine and conflict analysis runs. Refreshed when product ingredients change or when a new model version is deployed. Never shown to the user in raw form — UI reads from this to display the Ingredient Guide.

---

#### 6.8 ProgressPhoto

**What it is:** A user-uploaded photo documenting their skin at a point in time. Used for personal before/after comparison. Never analyzed by AI (no facial scanning).

**Attributes:**
- Unique identifier
- User reference
- Photo date (user-confirmed date — defaults to today but editable)
- Storage URL (cloud storage reference)
- Thumbnail URL (generated server-side for gallery display)
- Caption (optional free-text)
- Skin tags at time of photo (snapshot of skin concerns active on that date — e.g., "active breakout", "post-treatment")
- Upload timestamp
- Free tier vs. premium flag (first 20 photos = free tier; additional = pro only)

**Lifecycle:** Created on upload. Caption and date editable. Never auto-deleted on subscription downgrade — the 20 free-tier photos are permanently preserved. Additional pro photos become view-only (not deleted) on downgrade, with a prompt to upgrade to regain upload access. Hard-deleted only on account deletion.

---

#### 6.9 SubscriptionRecord

**What it is:** A local record of the user's current subscription state, synced from RevenueCat. Used for feature gating without requiring a live RevenueCat call on every screen load.

**Attributes:**
- User reference
- Plan tier (free / pro-monthly / pro-annual / lifetime)
- Status (active / expired / grace-period / cancelled)
- Renewal date (for monthly/annual plans)
- Purchase date
- Platform (ios — for App Store receipts)
- Last synced timestamp (cache validity — considered stale after 48 hours)

**Lifecycle:** Created at first purchase. Updated on every successful RevenueCat webhook event and on app open sync. The 48-hour stale cache ensures paying users are never locked out during RevenueCat outages.

---

#### 6.10 CommunityProduct (Deferred to v1.1)

**What it is:** A product record contributed by a user to the shared community database — distinct from a user's personal shelf product. Requires moderation before becoming visible to others.

**Attributes:** Same core attributes as Product, plus: contributor User reference, moderation status (pending / approved / rejected), moderation notes, view count, times added to shelves by other users.

**Lifecycle:** Submitted by any user. Pending moderation review. Approved records become searchable by all users as a starting point for shelf additions. Rejected records are archived with a reason. *Note: Full community contribution with moderation queue is deferred to v1.1 — at launch, users can access an existing product database via barcode and Open Food Facts, but the community submission workflow is not live.*

---

### 6.11 Content Types

**User-generated content:** All SkinLogEntries, ProgressPhotos, product notes, routine names, and step annotations are purely user-authored. GlowLog does not edit or use this content for any purpose other than displaying it back to the user and (with consent) running local correlation analysis.

**System-generated content:** Ingredient conflict results, layering order suggestions, Skin Story summaries (Pro), weekly skin pattern observations (Free — top 3 statistical highlights), and streak calculations are all generated by the system based on user data. These are clearly labeled as system-generated in the UI and never presented as medical advice.

**Bundled reference content:** The ingredient conflict rules database (~200KB JSON, ~500 known conflict pairs) and ingredient education content are bundled with the app and updated via over-the-air updates. This is static reference content, not per-user data.

---

### 6.12 Offline vs. Cloud Data

**Must work fully offline:**
- Viewing the product shelf and product details
- Viewing existing routines and marking them complete
- Logging a skin condition entry
- Viewing the home dashboard with current streak and recent history
- Accessing the ingredient conflict guide for already-analyzed routines (using cached results)
- Viewing progress photos (thumbnails cached; full resolution requires connectivity)

**Requires connectivity:**
- Barcode scan → product lookup (Open Food Facts / community database)
- Ingredient conflict analysis via Claude API (on-device rules cover the fallback)
- Generating or refreshing a Skin Story summary
- Uploading progress photos
- Subscription purchase and sync
- Account creation and login

Offline-created entries (skin logs, routine completions) queue locally and sync when connectivity is restored. The user should never lose a log entry due to poor connectivity.

---

## 7. Non-Functional Requirements

### 7.1 Performance (From the User's Perspective)

Every performance target below is described as a user-perceived experience, not a server metric.

- **App launch:** The app opens to an interactive home dashboard in under 3 seconds on an iPhone 12 running iOS 16. The user should never stare at a blank screen or spinner on cold start.
- **Barcode scan:** From the moment the barcode is in frame to a product result appearing on screen: under 2 seconds for cache hits (bundled product cache or Open Food Facts), under 5 seconds for live API lookups. If lookup takes longer than 2 seconds, a progress indicator appears immediately — never a frozen camera.
- **Routine completion:** Tapping "Complete Routine" updates the streak and dashboard instantly (optimistic UI update). The server sync happens in the background — the user never waits for a network round-trip to see their streak increment.
- **Ingredient conflict detection:** Initial conflict flags appear within 50ms of adding a product to a routine, using the on-device bundled rules. The full Claude-enhanced explanation with layering order appears within 3–5 seconds as an async update — the user is never blocked from saving the routine while this loads.
- **Skin Story generation:** Because this is a background job (runs weekly overnight), the result is ready when the user opens the app the next morning. No spinner on the dashboard waiting for an AI call — the most recently generated story is always shown, with a freshness timestamp.
- **Photo gallery:** The progress photo gallery loads thumbnail-quality images immediately from local cache. Full-resolution photos load on demand when a user taps to expand.
- **Dashboard render:** The home dashboard — including streak, today's routines, and weekly skin summary — renders from local data first. Any cloud-refreshed data updates the UI silently without triggering a full page reload.

### 7.2 Accessibility

GlowLog targets **WCAG 2.1 Level AA** as a minimum across all screens.

- **Dynamic Type:** All text scales correctly with iOS Dynamic Type settings up to "Accessibility Extra Extra Extra Large." No text is truncated or overlaps interactive elements at large sizes.
- **VoiceOver:** All interactive elements have meaningful accessibility labels. Routine steps can be navigated, reordered, and marked complete via VoiceOver. Progress photos have descriptive labels including the photo date and any user-provided caption.
- **Color contrast:** All text meets a 4.5:1 contrast ratio against its background in both light and dark mode. Status indicators (streak active, conflict warning, routine complete) never rely on color alone — icons and text labels accompany all color-coded states.
- **Tap target sizes:** All interactive elements meet a minimum 44×44pt touch target per Apple HIG guidelines. The daily skin log sliders (1–5 scale) are wide enough to tap accurately without precision.
- **Reduced Motion:** Animations (streak celebration, routine completion) respect the iOS "Reduce Motion" system setting. No purely decorative animations are required for app comprehension.
- **Haptic feedback:** Completing a routine triggers a success haptic. Ingredient conflict warnings trigger a warning haptic. Haptics are never the only feedback channel — visual confirmation always accompanies them.

### 7.3 Platform & Device Requirements

- **Platform:** iOS only at launch. Android is explicitly deferred.
- **Minimum iOS version:** iOS 16.0. This covers approximately 95%+ of active iPhones as of 2024 and allows use of modern Swift/SwiftUI patterns in native modules if needed.
- **Minimum device:** iPhone 12 (A14 Bionic chip). No iPad-specific layout is required at launch — the app runs on iPad in compatibility mode.
- **Camera:** Barcode scanning requires camera access. The app gracefully degrades to manual entry if camera permission is denied — the user is never blocked.
- **Location:** UV index fetching requests "when in use" location permission for environmental correlation. This is optional and clearly explained. If denied, UV index simply shows as unavailable in skin logs.
- **Notifications:** Push notifications for routine reminders require notification permission. Requesting this permission happens at the end of onboarding with a clear value explanation — not as a system prompt on first launch.
- **Storage:** The app's local bundle (including bundled ingredient rules) targets under 50MB installed size. Progress photos are stored in cloud storage — local device storage is used only for thumbnail caches.

### 7.4 Offline Behavior

GlowLog is a logging app. Logging must always work, regardless of connectivity. The app should behave as follows when offline:

- The home dashboard, product shelf, routine builder, and skin log screens all load and function fully from locally cached data.
- Routine completions logged offline are queued and synced automatically when connectivity returns. The streak updates optimistically on-device immediately.
- Skin log entries created offline are queued and synced. The user receives no error — the entry is saved locally and a subtle "syncing" indicator appears when connectivity is restored and sync completes.
- Barcode scanning while offline shows a clear "No connection — enter product manually" prompt after the local cache miss, with manual entry immediately available.
- Ingredient conflict checking while offline uses the bundled on-device rules exclusively. A banner notes that nuanced AI-enhanced analysis will be available when connected.
- The Skin Story dashboard shows the last successfully generated story with its timestamp. No error state — just a clear "last updated X days ago" label.
- Progress photo uploads queue offline and upload automatically when connectivity returns.

---

## 8. Success Criteria & Scope

### 8.1 North Star Metric

**7-day routine completion rate among users who have used the app for at least 14 days.**

This metric captures whether GlowLog is actually helping users build and maintain skincare habits — not just whether they downloaded the app. A user who logs in once and abandons is a failure. A user who consistently completes their routines and returns to log their skin is a success. Target: **≥ 50% of 14-day-retained users complete at least one routine in any given 7-day window.**

### 8.2 Leading Indicators of Success

These metrics signal whether the north star metric is on track, typically visible within the first 4–6 weeks post-launch:

| Indicator | Target | Why It Matters |
|---|---|---|
| Day-7 retention | ≥ 30% | Indicates the core logging loop is engaging enough to bring users back |
| Day-30 retention | ≥ 15% | Validates habit formation — typical for utility apps with strong value |
| Products added per new user (first 7 days) | ≥ 3 | Users who build a shelf are dramatically more likely to build routines |
| Routines created per new user (first 7 days) | ≥ 1 | The core "activated" state — a user with a scheduled routine has something to return to |
| Skin log completion rate | ≥ 3 logs/week per active user | Skin logs fuel the Skin Story engine; low log rates make the correlation feature useless |
| Barcode scan success rate | ≥ 70% for common Western brands | A scan that consistently fails destroys trust in the product entry flow |
| Ingredient conflict analysis satisfaction | ≥ 80% positive on in-app thumbs rating | Validates the AI quality bar for conflict detection |
| Free → Pro conversion rate | ≥ 5% of monthly active users within 90 days | Validates the freemium model's premium value proposition |
| MRR at Month 6 | ≥ $500 | Covers infrastructure costs and validates commercial viability for a solo indie dev |
| App Store rating | ≥ 4.4 stars within first 60 reviews | Below this, App Store algorithmic visibility is significantly reduced |

### 8.3 AI Quality Bars

The following are minimum acceptable performance thresholds for AI-powered features. If these are not met, the feature must fall back gracefully or be gated behind a "beta" label until quality improves.

**Ingredient Conflict Detection (on-device rules + Claude):**
- Correctly identifies all 10 high-severity conflicts in the golden test set (Retinol + AHA, Retinol + Benzoyl Peroxide, high-dose Vitamin C + Niacinamide at low pH, etc.) with zero false negatives on critical conflicts.
- False positive rate on the 10 known-safe combinations in the golden test set: ≤ 2 out of 10 (some false positives are acceptable; zero false negatives on dangerous combinations is non-negotiable).
- Layering order suggestion matches dermatologist-recommended order for at least 8 out of 10 complex multi-product scenarios in the golden test set.
- Plain-language explanation is rated "clear and useful" by ≥ 80% of beta testers in qualitative testing.

**Skin Story Correlation Summaries (Pro — Claude):**
- Summaries must never fabricate correlations not supported by the user's actual logged data. Hallucinated insights are the single largest trust risk for this feature.
- Each summary must include at least one actionable observation ("Your skin scores were consistently higher on days you completed your PM routine") and at least one pattern question ("Your breakout score spiked on 3 of the 5 days following high UV index readings — worth monitoring").
- Summaries are reviewed by the developer against a set of 5 synthetic user datasets during QA — any summary that invents data not present in the input is a blocking defect.

**Barcode Lookup + Vision Extraction (GPT-5 Vision — v1.1):**
- Vision extraction of ingredient lists from clear product label photos: ≥ 85% accuracy on INCI ingredient names for English-language labels.
- All vision-extracted results are shown to the user for confirmation before saving — accuracy bar for auto-acceptance is intentionally not set, because user verification is mandatory.

### 8.4 Solo Developer Scope Decisions

Building GlowLog as a solo indie developer requires honest prioritization. Every feature that ships in v1 is a feature that one person must build, test, debug, maintain, and support. The following scope decisions were made with this constraint explicitly in mind.

**What was cut for MVP:** The community product database with moderation queue was cut entirely — it introduces operational overhead (moderation tooling, spam handling, user appeals) that is disproportionate to its v1 value when manual entry covers the gap. GPT-5 Vision label extraction was deferred to v1.1 — the barcode + Open Food Facts path covers the majority of common Western brands, and manual entry handles everything else. Environmental data correlation (UV index, humidity from Open-Meteo) is collected in skin logs at launch but the automated correlation analysis against environmental factors is deferred to v1.1, when there will be enough logged data to make it statistically meaningful. Android support is explicitly out of scope — a React Native codebase keeps this achievable later, but a single-platform launch halves QA surface area at a critical phase.

**Trade-offs made:** The Skin Story correlation engine ships as a Pro feature in v1, but uses simpler weekly statistical summaries rather than fully AI-generated narratives for free users. This reduces Claude API call volume by approximately 70% and defers the most complex AI feature to after launch when it can be validated with real data. The ingredient conflict engine ships with the bundled on-device rules as the primary source, with Claude as an enhancement layer — this means the core value proposition works even if the Claude API is unavailable, and keeps AI costs bounded while the user base is small.

**Realistic success metrics for a one-person launch:** MRR of $500–$2,000 within 6 months is a meaningful indie success milestone — not a startup growth target. Reaching 500 active users within the first 90 days through App Store organic discovery and skincare community seeding (Reddit's r/SkincareAddiction, YouTube skincare creators) is a realistic goal. A 4.4+ App Store rating within the first 60 reviews validates product quality. These are metrics one developer can act on — A/B test results, funnel dashboards, and cohort retention analyses are monitoring tools, not weekly OKRs.

### 8.5 v1 Scope: In-Scope and Out-of-Scope

#### In Scope (v1 Launch)
- Flexible recurring routine scheduler (daily, every-N-days, weekly, monthly, custom) with timezone-aware reminders
- Shelf-first product entry via barcode scan, Open Food Facts lookup, and full manual entry
- Routine builder from owned products with suggested layering order by product type
- Ingredient conflict detection using bundled on-device rules, enhanced by Claude API for plain-language explanation
- Basic skin condition logging (breakouts, dryness, redness, sensitivity, oiliness — 0–5 scale)
- Weekly skin summary with top 3 statistical pattern observations (free tier — no LLM)
- Skin Story AI correlation summaries (Pro — weekly Claude-generated narrative)
- Progress photo storage (20 photos free, unlimited Pro)
- Grace-period streak tracking with recovery logic
- Home dashboard with today's routines, streak, and weekly skin chart
- Honest freemium with RevenueCat: Free / Pro ($7.99/month or $49.99/year) / Lifetime ($79.99)
- Apple Sign-In and email/password authentication
- Full data export (JSON) for all user data — GDPR compliance
- Account deletion with complete data purge

#### Out of Scope (v1 — Deferred to v1.1 or Later)
- Android support
- Community product database with user submissions and moderation queue
- GPT-5 Vision label photo extraction for unrecognized products
- Environmental data correlation analysis (UV index correlation against skin scores)
- Social features: sharing routines, following other users, public profiles
- Dermatologist or professional review integration
- Product recommendation engine ("users with similar skin type also use...")
- In-app chat or support chat
- Apple Watch companion app
- Widgets (iOS Home Screen / Lock Screen)

### 8.6 Open Questions for Development

1. **Skin log frequency UX:** Should the app prompt daily skin logging via a push notification, or rely on the user initiating it from the dashboard? Daily prompts risk feeling nagging; no prompts risk users forgetting to log, which breaks the Skin Story engine's value. A configurable optional daily reminder is the likely answer — validate with beta users.

2. **Streak grace period defaults:** What grace period should ship as the default? Zero feels punishing for dedicated users in different timezones; 4 hours may feel like it trivializes the streak concept. The 2-hour default is reasonable but should be explicitly communicated to users during onboarding.

3. **Ingredient conflict severity tiers:** The current design flags conflicts as "warning" or "caution" — should there be a third tier for "myth / commonly misunderstood" (e.g., the Vitamin C + Niacinamide interaction is largely debunked at typical formulation concentrations)? This is educationally valuable but adds UX complexity.

4. **Minimum data threshold for Skin Story:** How many days of skin logs and routine completions should be required before the Skin Story engine generates a summary? Too few data points produce meaningless or misleading patterns. 14 days seems like a reasonable minimum — validate with beta data.

5. **Product shelf vs. global product database UX:** When a user searches for a product to add, should search results show only their shelf or also suggest community/database products? This affects how the product entry flow feels and has implications for v1.1 community database scope.

---

## 9. Anti-Patterns

The following behaviors and design decisions are explicitly prohibited in GlowLog. They are derived from observed competitor failures, App Store review analysis, and fundamental product values.

### 9.1 Paywall Anti-Patterns (Competitor Failures Observed in: Routinely, Skin Bliss, Skan)

**Never gate core logging behind a subscription.** Logging products you own, building a routine, and checking ingredient conflicts are the core value of the app. Locking these behind a paywall creates the exact complaint pattern that dominates competitor 1-star reviews: "Can't do anything without paying." GlowLog's free tier is generous by design — this is a competitive moat, not a cost center.

**Never show subscription prompts on core-use screens.** No "Upgrade to Pro" banners on the home dashboard, the routine builder, or the skin log screen. Upgrade prompts appear only when a user explicitly attempts to access a Pro feature (e.g., tapping "View Full Skin Story" or uploading photo #21). The distinction matters: contextual upgrade prompts after a user has discovered value are acceptable; ambient pressure prompts that interrupt normal use destroy trust.

**Never use dark patterns on the paywall screen.** No "free trial" that silently converts to a paid subscription without a reminder. No annual plan pre-selected by default when the user hasn't indicated preference. No countdown timers or fake "offer ending soon" messaging. The pricing screen shows three options (monthly, annual, lifetime) with honest pricing and a clear "No thanks, continue free" exit.

**Never hard-delete user data on subscription downgrade.** A user who cancels Pro should never lose their logs, routines, or photos. The 20 free-tier photos are permanently preserved. Losing data on downgrade is a trust-destroying experience that generates the worst possible App Store reviews.

### 9.2 AI & Ingredient Analysis Anti-Patterns

**Never present AI-generated ingredient advice as medical fact.** All conflict warnings and Skin Story observations must include a disclaimer: "This is informational, not medical advice. Consult a dermatologist for personalized recommendations." The disclaimer must be visible, not buried in a terms link.

**Never silently save vision-extracted ingredient lists.** When GPT-5 Vision extracts an ingredient list from a label photo, the user must see and confirm the extracted list before it is saved. Auto-accepting an AI extraction that contains errors could cascade into wrong conflict analysis for every routine that product appears in.

**Never fabricate correlations in Skin Story.** If a user has logged 5 days of data, the Skin Story must not invent patterns that aren't statistically supportable from that data. It is better to tell the user "Log at least 14 days to see meaningful patterns" than to produce a confident-sounding but data-free insight.

**Never block the user while AI analysis loads.** Ingredient analysis, Skin Story generation, and barcode lookups should never block the user from saving a routine, completing a log, or navigating the app. Every AI call runs asynchronously with an optimistic UI — the user sees an immediate response and AI enhancement appears as an update.

### 9.3 UX Anti-Patterns (Competitor Failures Observed in: FeelinMySkin, Skincare Routine Planner)

**Never require a preset product database to function.** If a user's product isn't in the database, they should never see an error or dead end. Manual entry with full ingredient list input is always available as the final fallback. A database miss should feel like a minor inconvenience — not a blocking failure.

**Never make routine scheduling inflexible.** AM/PM toggles alone are insufficient for users managing actives like retinol (every 3 nights) or AHA exfoliants (twice weekly). Every-N-days and specific-weekday scheduling must be first-class options, not afterthoughts.

**Never crash or freeze on the routine builder screen.** The routine builder — add products, reorder, save — is the most frequently visited feature for returning users. Any performance regression on this screen is a critical bug, not a nice-to-fix.

**Never send routine reminders at the wrong time due to timezone handling.** A reminder for a PM routine arriving at 2 AM because the user traveled is a deeply frustrating experience that causes notification permission to be revoked. Timezone-aware scheduling is non-negotiable.

**Never make ingredient information feel intimidating or overly clinical.** GlowLog's target audience includes beginners who feel overwhelmed by conflicting skincare advice. Ingredient education must be in plain language, calibrated to the user's self-reported experience level. INCI jargon without explanation is a barrier, not a feature.

### 9.4 Privacy Anti-Patterns

**Never use facial scanning or biometric analysis.** GlowLog explicitly does not analyze photos of the user's face using computer vision or AI. Progress photos are stored as files, never processed through a model. This is a core product value and must be clearly communicated to users in onboarding and the App Store description.

**Never collect data passively without explicit user action.** Every piece of health data in GlowLog is entered by the user deliberately. No background data collection, no passive sensor monitoring, no inferred health states.

**Never make data export difficult or unavailable.** Users have a right to their data. The export feature must be accessible from the profile/settings screen at all times — not gated behind Pro, not requiring a support ticket.

---

## 10. API Surface Area

### 10.1 External Services GlowLog Communicates With

---

**Open Food Facts API**
GlowLog uses Open Food Facts as the first external lookup destination after the local product cache misses on a barcode scan. Open Food Facts provides product name, brand, and ingredient data for a large catalog of consumer products including many skincare items. Communication is read-only and unauthenticated. This is a public service — no API key required — and its terms permit free use. Coverage is best for Western mass-market brands and diminishes for niche or K-beauty products, which is why manual entry is always a fallback.

**Anthropic Claude API**
The highest-value external AI integration. GlowLog communicates with Claude for three distinct purposes: generating plain-language ingredient conflict explanations and layering order suggestions; producing weekly Skin Story correlation summaries (Pro); and providing beginner-calibrated ingredient education when a user taps an ingredient to learn more. All calls to Claude originate from the server-side Edge Functions layer — the API key is never in the client. Claude receives only structured data (ingredient lists, skin condition scores, routine completion rates) and never receives photos or facial data.

**OpenAI GPT-5 Vision API (v1.1)**
Used exclusively as a fallback when barcode scan and Open Food Facts both fail to identify a product. The user photographs the product label and GPT-5 Vision extracts the product name, brand, and ingredient list from the image. Like Claude, this is called only from the server side. Vision extraction results are always shown to the user for confirmation before being saved — the model output is an assistant, not an authority.

**Open-Meteo API**
A free, open-source weather and UV index API that requires no API key for moderate usage volumes. GlowLog fetches UV index and broad environmental data (season, general humidity level) on-demand when a user logs their daily skin condition — if they have granted location permission. This data is stored alongside the skin log entry and used by the Skin Story correlation engine. Communication is read-only and lightweight — a single GET request per skin log entry, only when location permission is granted.

**RevenueCat**
GlowLog's subscription management layer. RevenueCat handles all App Store receipt validation, subscription state management, and entitlement checks. GlowLog communicates with RevenueCat in two directions: the client SDK communicates RevenueCat purchase and restore events, and RevenueCat sends server-to-server webhooks to GlowLog's backend when subscription states change (new purchase, renewal, cancellation, lapse). This webhook-driven approach ensures subscription state is accurate even if the user doesn't open the app. GlowLog caches the subscription state locally for 48 hours to protect paying users from RevenueCat outages.

**Upstash Redis**
A managed Redis service used as the caching layer for AI API responses. GlowLog's Edge Functions check Upstash Redis before making any call to Claude or GPT-5 Vision. Cache keys are deterministic hashes of the input data (ingredient lists, prompt type) — meaning identical ingredient combinations share a cache entry regardless of which user triggered the analysis. This is the primary cost-optimization mechanism for AI usage. Upstash is also used for lightweight rate limiting on AI-calling endpoints.

**Expo Push Notifications / Apple Push Notification Service (APNs)**
Routine reminders are delivered via push notifications. GlowLog uses Expo's managed push notification infrastructure, which handles the integration with APNs. Notification scheduling happens server-side based on each routine's recurrence rule and timezone — this ensures reminders are delivered at the correct local time even when the user travels. The client registers a push token on app launch; the server manages the notification schedule.

**Supabase Storage**
All progress photos are stored in Supabase's object storage service. The client uploads photos directly to Supabase Storage using a signed upload URL generated by the server — the photo bytes never pass through GlowLog's Edge Functions, keeping upload performance high and server costs low. Thumbnails are generated server-side via a Supabase Storage transformation. Storage access is access-controlled by user identity.

---

### 10.2 What GlowLog's Own Backend Must Support

The following are the user actions and system events that require server-side processing. These are described by what they do, not how they're implemented.

**Product Barcode Lookup Orchestration**
When a user scans a barcode, the backend orchestrates a multi-step lookup: check the Upstash cache first, then query Open Food Facts, then check the community product database (v1.1). It returns a normalized product object to the client. If no match is found, it returns a structured "not found" response with a manual entry prompt — never an error state. The client never calls Open Food Facts directly.

**Ingredient Conflict Analysis and Layering Suggestion**
When a user saves or modifies a routine, the backend receives the full ingredient lists for all products in the routine, checks the Upstash cache using an ingredient fingerprint hash, and (on a cache miss) calls Claude to produce conflict flags and layering suggestions. Returns a structured conflict result and caches it. Also runs on-demand when a user adds a single product to their shelf and taps the "Check Ingredients" action.

**Weekly Skin Story Generation (Pro)**
A scheduled background process — not triggered by user action — that runs weekly for all Pro users who have at least 14 days of logged data. For each eligible user, it aggregates their skin log scores, routine completion rates, and product usage frequency over the past 30 days, builds a structured prompt, calls Claude, and stores the resulting narrative summary. The client simply reads the most recently generated story — it never triggers this process directly.

**Free-Tier Weekly Summary Generation**
A lighter scheduled process that runs weekly for all users and computes the top 3 statistical pattern observations from their skin log and routine completion data. This uses database aggregation queries only — no LLM call — and produces a structured summary (e.g., "Your best skin days correlated with completing your PM routine"). Available on the free tier.

**Push Notification Scheduling**
When a user creates or modifies a routine (name, schedule, reminder time, timezone), the backend recalculates the notification schedule and updates the push notification queue accordingly. This must account for recurrence rules, grace periods, and the user's stored home timezone. The backend — not the client — owns the notification schedule to ensure correctness when the user's device is offline or they've switched devices.

**Subscription Webhook Handling**
The backend receives RevenueCat webhook events and updates the user's subscription record accordingly. This must handle: new subscriptions, renewals, cancellations (immediate and end-of-period), subscription lapses, refunds, and lifetime purchase events. The response to each event updates the user's entitlement cache and may trigger email notifications (e.g., "Your Pro subscription has expired").

**Progress Photo Upload Authorization**
When a user initiates a photo upload, the backend checks their subscription status and current photo count, and if authorized, generates a signed upload URL for direct-to-Supabase-Storage upload. This check happens server-side — the client cannot generate its own upload URLs. Free users uploading beyond photo #20 receive a clear upgrade prompt rather than an error.

**Data Export**
When a user requests a data export (GDPR right of access), the backend compiles all their data — product shelf, routines, routine completion logs, skin log entries, progress photo metadata (not photo files), ingredient conflict history — into a structured JSON file and either emails it to their registered address or provides a time-limited download link. This must complete within a reasonable timeframe even for power users with years of logs.

**Account Deletion**
When a user deletes their account, the backend must: cancel any active subscription via RevenueCat, delete all user data from the database, delete all progress photos from storage, and confirm deletion to the user. Hard delete — no soft delete, no retention for analytics.

---

### 10.3 Real-Time vs. Request-Response Interactions

**Request-response (the majority of GlowLog's API surface):**
All user-initiated actions — logging skin condition, completing a routine, adding a product, saving a routine — are standard request-response interactions. The client sends an action, the server processes it, and confirms success. These are expected to complete in under 1 second for non-AI operations.

**Asynchronous with polling / push update:**
Ingredient conflict analysis runs asynchronously — the client sends the routine data, receives an immediate "analysis queued" response, and the UI updates when the result is ready (either via polling or a lightweight server-sent event). The user is never blocked waiting for this.

**Scheduled / background (no real-time component):**
Skin Story generation and free-tier weekly summary generation are background jobs. No real-time connection needed — the client reads the stored result.

**Webhook-driven (server-to-server):**
RevenueCat subscription events are pushed to GlowLog's backend via webhook. The user's client picks up the updated subscription state on next app open via a sync check.

There are no features in GlowLog v1 that require persistent WebSocket connections or live collaborative real-time functionality.

---

## 11. Timeline & Milestones

### 16-Week Solo Development Plan

This timeline is calibrated for a single developer working full-time on GlowLog from project initialization to App Store approval. Each phase has explicit deliverables that define "done" for that phase before the next begins.

---

#### Phase 1: Foundation (Weeks 1–2)
**Focus:** Project infrastructure, authentication, database schema, and navigation skeleton.

**Deliverables:**
- Expo SDK 52 project initialized with Expo Router v4 file-based navigation (5-tab layout: Home, Shelf, Routines, Log, Profile)
- Supabase project created with complete database schema defined and migrations applied — all core entities (users, products, routines, routine_steps, routine_completion_logs, skin_log_entries, progress_photos, subscription_records)
- Row-Level Security policies verified on all tables using a two-user cross-access test
- Apple Sign-In and email/password authentication working end-to-end on a physical device
- Basic 3-step onboarding flow (sign up → skin profile quiz → notification permission request)
- Navigation skeleton with placeholder screens for all 5 tabs
- Supabase staging and production projects configured separately

**Phase Gate:** A new user can sign up with Apple or email, complete onboarding, and land on the home dashboard. Authentication state persists across app restarts.

---

#### Phase 2: Product Shelf & Barcode Scanning (Weeks 3–5)
**Focus:** The product entry foundation — everything the routine builder depends on.

**Deliverables:**
- Product Shelf screen: grid/list view of owned products with search and sort (recently added, product type, most used)
- Add Product screen with three entry paths:
  - Barcode scan via expo-camera (SDK 52) → Open Food Facts lookup → result confirmation screen
  - Manual entry form with all product attributes including INCI ingredient list
  - Search in existing database (placeholder for v1.1 community database — shows manual entry for now)
- Product Detail screen: view/edit all product attributes, ingredient list display
- Barcode lookup orchestration Edge Function deployed and working against Open Food Facts
- Local product cache (bundled top-5000 products) integrated for offline and low-latency scan results
- Barcode scan success rate tested against 30 common Western skincare products — target ≥ 70% match rate

**Phase Gate:** A user can add at least 5 products to their shelf via barcode scan and manual entry. Products persist across sessions. Barcode scan to result takes under 2 seconds on cache hits.

---

#### Phase 3: Routine Builder & Scheduler (Weeks 6–8)
**Focus:** The core returning-user experience — building and scheduling routines.

**Deliverables:**
- Routine Builder screen: select products from shelf, drag-and-drop ordering (React Native Reanimated 3), name routine, set time-of-day designation (AM/PM/anytime)
- Suggested layering order by product type shown as a non-blocking recommendation when products are added
- Recurrence rule UI: daily / every-N-days / specific weekdays / monthly / custom — stored as RRULE-style data
- Timezone-aware routine reminders: Edge Function generates push notification schedule based on recurrence rule and user's home timezone; Expo Notifications handles delivery
- Routine list screen with active routines, next-due date, and current streak displayed per routine
- Routine completion flow: tap to complete, mark individual steps, partial completion handling
- Streak calculation logic fully tested (recurrence rule → next due date → grace period → streak increment/break)
- Grace period setting (default 2 hours, user-configurable) implemented and tested with simulated timezone changes
- Up to 5 active routines enforced for free tier

**Phase Gate:** A user can create a routine with 3+ products, schedule it for every 2 days at 8 PM, receive a push notification, and mark it complete — with streak incrementing correctly. Tested with simulated travel (device timezone change).

---

#### Phase 4: Skin Logging & Dashboard (Weeks 9–10)
**Focus:** The data input that powers Skin Story and creates the daily habit loop.

**Deliverables:**
- Daily skin log screen: sliders for overall score, breakout, dryness, redness, sensitivity, oiliness (0–5); optional free-text note; optional UV index fetch (with location permission prompt)
- One-entry-per-day enforcement with same-day editing allowed
- Home Dashboard complete:
  - Today's AM/PM routines with completion status
  - Current streak display (longest streak high-water mark visible)
  - Quick-log skin condition shortcut button
  - 7-day skin score mini-chart (react-native-chart-kit)
- Weekly skin summary computation: database aggregation query producing top 3 pattern observations (free tier — no LLM) — e.g., "You completed your PM routine 6/7 days this week" / "Your average skin score was 3.8 — up from 3.2 last week"
- Offline log queue: skin logs and routine completions created offline sync on connectivity restoration
- Skin log history screen: calendar view with color-coded skin score per day, tap to view full entry

**Phase Gate:** A user can log their skin condition every day for a week and see a meaningful weekly summary on the dashboard. Offline logging works and syncs correctly.

---

#### Phase 5: Ingredient Conflict Engine & Monetization (Week 11)
**Focus:** The highest-differentiating feature and the revenue layer — both must be solid before TestFlight.

**Deliverables:**
- On-device bundled ingredient conflict rules JSON (~200KB, ~500 conflict pairs) integrated — instant conflict flags on product add to routine
- Ingredient Conflict Guide screen: displays all conflicts detected across a routine's products, each with severity level and plain-language explanation
- Claude API integration (analyze-ingredients Edge Function): async enhanced explanation and layering order generated and cached via Upstash Redis
- Offline fallback tested: bundled rules work with no connectivity; banner confirms "extended analysis unavailable offline"
- RevenueCat integration: Free / Pro monthly ($7.99) / Pro annual ($49.99) / Lifetime ($79.99) products configured in App Store Connect and RevenueCat
- Paywall screen: clean 3-option pricing display, no dark patterns, clear "Continue Free" exit
- Pro feature gates active: Skin Story (Pro), photo upload beyond 20 (Pro), data export (free — GDPR required)
- Subscription webhook handler deployed: new purchase, renewal, cancellation, and lapse events update subscription records correctly
- Local subscription state cache (48-hour validity) implemented

**Phase Gate:** A user can add products to a routine and see at least 3 known conflicts correctly detected within 50ms. RevenueCat purchase flow completes end-to-end in sandbox. A paying user retains access during a simulated RevenueCat outage (within 48-hour cache window).

---

#### Phase 6: Progress Photos, Skin Story & Polish (Weeks 12–13)
**Focus:** Premium features, visual polish, and pre-launch quality.

**Deliverables:**
- Progress photo upload: camera/library picker, direct-to-Supabase-Storage upload via signed URL, thumbnail display in gallery
- 20-photo free tier enforced server-side; upgrade prompt on limit hit; downgraded users can view but not add photos
- Skin Story dashboard (Pro): weekly Claude-generated narrative summaries via Inngest scheduled job (weekly, min 14 days of data required); displays last generated story with timestamp; simplified statistical summary shown when data insufficient
- Ingredient education: tap any ingredient to see a plain-language explanation calibrated to user's experience level (Claude-generated, cached aggressively)
- Settings / Profile screen: edit skin profile, notification preferences, subscription management (links to App Store subscription management), data export, account deletion
- Data export: generates JSON of all user data, delivered via email or download link
- Dark mode: all screens verified in both light and dark mode
- Dynamic Type: all text verified at "Accessibility Extra Extra Extra Large" setting
- VoiceOver: routine completion and skin log flows verified navigable via VoiceOver
- App icon, splash screen, and onboarding illustrations finalized
- Crash logging integrated (Sentry or equivalent)

**Phase Gate:** All 7 core features work without crashes on iPhone 12. Dark mode is complete. VoiceOver navigation works on critical flows. A Pro user can see their Skin Story after 14 days of logged data.

---

#### Phase 7: Beta Testing (Week 14)
**Focus:** External validation with 10–20 real users via TestFlight.

**Deliverables:**
- TestFlight build distributed to 10–20 beta users recruited from r/SkincareAddiction, personal network, or skincare Discord communities
- Typeform survey covering: onboarding clarity, barcode scan success rate, ingredient conflict usefulness, routine scheduling intuitiveness, paywall perception
- Bug triage: all crash-level bugs fixed; UX friction issues documented and prioritized
- Golden test set re-run against production Claude integration
- Performance benchmarks on physical iPhone 12: cold start, barcode scan, ingredient conflict analysis, routine completion

**Phase Gate:** Zero crash-level bugs in beta. App Store rating from beta cohort equivalent ≥ 4.0. Barcode scan success rate ≥ 70% on real users' products.

---

#### Phase 8: App Store Submission & Launch (Weeks 15–16)
**Focus:** App Store submission, approval, and public launch.

**Deliverables:**
- App Store Connect listing complete: screenshots for all required iPhone sizes, app description, keywords, privacy nutrition label
- Privacy policy and terms of service published (linked in app and App Store listing)
- GDPR consent screen verified in onboarding
- All launch checklist items completed (RLS verified on production, Edge Functions deployed with production API keys, RevenueCat production configuration)
- App Store submission → Apple review (~24–48 hours for initial review)
- Launch announcement prepared for skincare communities (Reddit, Twitter/X, relevant Discord servers)

**MVP Launch Target:** End of Week 16.

**Post-Launch (Weeks 17+):** Monitor crash reports, respond to App Store reviews within 48 hours, triage and fix any launch-day bugs in a hotfix build. Begin planning v1.1 scope (community product database, GPT-5 Vision extraction, environmental correlation analysis) based on user feedback.

---

## 12. Design Requirements

### 12.1 Visual Identity & Design Philosophy

GlowLog's visual design should feel like a well-made personal wellness journal — clean, warm, and trustworthy. The aesthetic should communicate confidence without clinical sterility. Think: a skincare shelf that's curated, not cluttered. The design system borrows from high-quality iOS apps (Notion, Streaks, Day One) — generous whitespace, clear typography hierarchy, and tactile interactions that feel native to the platform.

The UI must feel premium at the free tier. If a free user's first impression is "this looks like a freemium app trying to look premium," GlowLog has failed at design. The paywall should feel like a natural discovery of bonus features, not a cage they've been living in.

---

### 12.2 Color Palette

GlowLog uses a warm, skin-toned palette anchored in soft neutrals with a single accent color used sparingly for calls-to-action and positive states.

**Light Mode:**
- **Background (Primary):** `#FAFAF8` — warm off-white, not pure white (avoids clinical feel)
- **Background (Secondary / Card surfaces):** `#F2F0EB` — warm light stone
- **Text (Primary):** `#1A1A18` — near-black with warmth, not pure black
- **Text (Secondary):** `#6B6560` — warm mid-gray for captions and labels
- **Accent (Primary — CTAs, active states, streak):** `#E8845A` — warm terracotta / sunset coral. Energetic without being aggressive. Communicates skin health and warmth.
- **Accent (Secondary — completed states, positive):** `#6BAE8E` — soft sage green. Used for "routine complete," "no conflicts detected," and positive skin trend indicators.
- **Warning:** `#E8A84A` — warm amber. Used for ingredient caution flags (mid-severity conflicts).
- **Danger:** `#D95C5C` — warm red. Reserved for high-severity ingredient conflicts only. Never used as a general error color to preserve its urgency signal.
- **Dividers / Borders:** `#E5E2DB` — warm light stone, slightly darker than card backgrounds

**Dark Mode:**
- **Background (Primary):** `#18181A` — near-black with a very slight cool tint to avoid the blue-black common in app dark modes
- **Background (Secondary / Card surfaces):** `#242426`
- **Text (Primary):** `#F0EDE8` — warm off-white
- **Text (Secondary):** `#9B9690`
- **Accent colors** maintain hue but are lightened approximately 10% for dark mode legibility. All contrast ratios are verified against dark backgrounds.

All color combinations must meet **4.5:1 contrast ratio** for normal text and **3:1** for large text and graphical elements, per WCAG 2.1 AA.

---

### 12.3 Typography

GlowLog uses the iOS system font stack — **San Francisco (SF Pro)** — exclusively. No custom typefaces are bundled. This is a deliberate decision: SF Pro renders beautifully, supports Dynamic Type natively, and avoids the 500KB–2MB font file overhead.

**Type Scale:**

| Role | Size | Weight | Usage |
|---|---|---|---|
| Large Title | 34pt | Bold | Screen titles (Product Shelf, Routines) |
| Title 1 | 28pt | Bold | Dashboard headline, section headers |
| Title 2 | 22pt | Semibold | Card titles, routine names |
| Title 3 | 20pt | Semibold | Product names, subsection headers |
| Body | 17pt | Regular | Primary content text, log entries |
| Callout | 16pt | Regular | Secondary content, ingredient lists |
| Subhead | 15pt | Medium | Labels, table section headers |
| Footnote | 13pt | Regular | Timestamps, captions, disclaimer text |
| Caption | 12pt | Regular | Metadata, tag labels |

All sizes scale proportionally with Dynamic Type. Minimum readable size is Caption at 12pt regular — no text in the app should fall below this at the default Dynamic Type setting.

**Numeric displays** (streak count, skin scores) use **SF Pro Rounded** for a friendlier, more approachable feel compared to standard SF Pro. Applied only to large numerical displays on the dashboard.

---

### 12.4 Spacing & Layout

GlowLog uses an 8pt base grid. All spacing values are multiples of 8 (8, 16, 24, 32, 48). This produces consistent visual rhythm across screens without requiring per-pixel decisions.

- **Screen edge margins:** 16pt (compact) / 24pt (regular)
- **Card internal padding:** 16pt
- **Section spacing (between card groups):** 24pt
- **Minimum tap target size:** 44×44pt (Apple HIG requirement)
- **List item height:** minimum 56pt (accommodates label + secondary text + tap target)

Routine steps in the routine builder use a slightly larger 64pt row height to accommodate the drag handle, step number, product name, and type icon comfortably.

---

### 12.5 Component Design Language

**Cards:** Rounded corners (12pt radius). Subtle shadow on light mode (`0 2 8 rgba(0,0,0,0.06)`); no shadow on dark mode (elevation handled by background color difference). Cards are the primary content container throughout the app.

**Buttons:**
- Primary CTA: filled terracotta (`#E8845A`), white text, 12pt corner radius, full-width or 48pt height minimum
- Secondary: outlined with terracotta border, terracotta text, same sizing
- Tertiary / text button: terracotta text only, no border or fill
- Destructive: filled `#D95C5C`, white text — used only for account deletion and hard-delete actions

**Form Inputs:** 12pt corner radius, 1pt border in `#E5E2DB` (light) or `#3A3A3D` (dark), 16pt internal padding. Active/focused state: border changes to terracotta accent. Error state: border changes to danger red with error message below.

**Ingredient conflict badges:**
- High severity: small red pill badge (`#D95C5C` background, white text)
- Caution: amber pill badge (`#E8A84A` background, dark text)
- Myth/common misunderstanding: light gray pill badge with info icon — clearly distinguished from actual conflict warnings

**Streak display:** The streak counter on the home dashboard uses SF Pro Rounded Bold at 48pt for the number, with a small flame icon in terracotta. The flame animates gently (scale pulse, 2s loop) when the streak is active, respecting the Reduce Motion setting.

---

### 12.6 Dark Mode

Dark mode is fully supported and must be complete at launch — not a v1.1 addition. iOS users expect dark mode support, and App Store reviewers check it explicitly.

Every screen, component, modal, and sheet must be verified in dark mode. The design system's dark mode tokens (backgrounds, text, borders, accent variants) are defined once in the theme layer and applied consistently — there are no hardcoded colors anywhere in the component code.

Dark mode switches automatically based on iOS system setting. GlowLog does not offer a manual in-app light/dark toggle at v1 — this avoids a settings screen option that adds complexity without meaningful user value at this scale.

---

### 12.7 Icon Style

GlowLog uses **SF Symbols 5** for all iconography, matching the system-native icon language of iOS 16+. SF Symbols inherit Dynamic Type scaling and support the full range of weights and rendering modes.

Custom icons are used only where no appropriate SF Symbol exists — primarily:
- The GlowLog app icon (custom)
- The "Skin Story" dashboard icon (a stylized chart-with-sparkle that doesn't have a clean SF Symbol equivalent)
- Product type category icons (cleanser, serum, moisturizer, SPF, exfoliant — small illustrated icons at 24pt, line-art style in the primary text color)

Custom icons are SVG-sourced and exported in the required resolution set. They match the weight and visual complexity of SF Symbols at the same size.

---

### 12.8 Animation Guidelines

Animations serve communication, not decoration. Every animation in GlowLog must have a clear purpose — conveying state change, providing feedback, or guiding attention.

**Routine completion animation:** When a user marks a routine complete, a brief success state plays — the routine card transitions to the "complete" color (sage green) with a checkmark scale-in (spring animation, 300ms). A success haptic fires simultaneously. This replaces a plain state change with a small moment of satisfaction that reinforces the habit loop.

**Streak milestone animation:** At milestone streaks (7 days, 30 days, 100 days), a celebratory confetti burst plays for 1.5 seconds before the normal dashboard is visible. Skippable by tap. Respects Reduce Motion (replaced by a static badge reveal).

**Screen transitions:** Standard iOS push/pop transitions. No custom page transitions that fight platform conventions.

**Drag-and-drop in routine builder:** Drag-to-reorder steps uses Reanimated 3 for 60fps performance. The dragged item lifts with a subtle scale increase (1.05x) and drop shadow. Other items animate smoothly out of the way (spring physics, 250ms).

**AI loading states:** When ingredient analysis or Skin Story generation is running asynchronously in the background, a subtle shimmer placeholder (skeleton screen) replaces the content area rather than a spinner. The shimmer uses the card background color with a traveling highlight — never a full-screen loading state.

**All animations respect the iOS "Reduce Motion" accessibility setting.** When Reduce Motion is enabled, cross-dissolve transitions replace all movement-based animations, and the routine completion animation is replaced by an instantaneous color change.

---

### 12.9 Accessibility Standards

GlowLog targets **WCAG 2.1 Level AA** as a minimum. The following are non-negotiable at launch:

- **VoiceOver:** All interactive elements have meaningful accessibility labels. Custom drag-and-drop in the routine builder has a VoiceOver-accessible alternative (reorder buttons appear in VoiceOver mode). Progress photos have descriptive labels.
- **Dynamic Type:** Tested at all Dynamic Type sizes up to "Accessibility Extra Extra Extra Large." No text truncates or overlaps interactive elements at maximum size.
- **Color contrast:** All text/background combinations meet 4.5:1 (normal text) and 3:1 (large text and UI components). Verified with a contrast checker against both light and dark mode tokens.
- **Color independence:** No information is conveyed by color alone. Every color-coded status (complete, conflict, warning) has an accompanying icon and/or text label.
- **Tap targets:** All interactive elements meet 44×44pt minimum.
- **Screen labels:** Every screen has a meaningful navigation title for VoiceOver announcement.

---

## 13. Risks & Mitigations

### Formal Risk Register

---

### Risk 1: App Store Rejection
**Likelihood:** Medium | **Impact:** High

**Scenarios:**
- **Health data privacy rejection:** GlowLog collects skin condition data, which Apple may classify under health-adjacent data requiring heightened privacy disclosure. Apple's App Store guidelines (Section 5.1.1) require explicit disclosure of data collection and use.
- **Subscription guideline violation:** Any ambiguity in the paywall screen — unclear pricing, missing "Continue Free" option, deceptive trial language — can trigger rejection under guideline 3.1.1.
- **Facial scanning misclassification:** If App Store reviewers believe GlowLog performs facial analysis (because of the progress photo feature), they may require additional disclosure or reject the app.

**Mitigations:**
- Complete the App Store privacy nutrition label accurately before submission — include skin condition data (health-adjacent), photos, usage data, and identifiers. Do not underreport.
- The paywall screen must be reviewed against Apple's Human Interface Guidelines for subscriptions before submission. Show all subscription options, price and duration clearly, free tier continuation option prominently. No pre-selected annual plan.
- App Store description and screenshots must explicitly state "No facial scanning or AI photo analysis" — proactively address the progress photo concern before a reviewer raises it.
- Prepare a reviewer note explaining the progress photo feature: photos are stored files, not processed by any model. Include this in the App Store Connect reviewer notes field.
- Submit with a TestFlight review first to catch obvious guideline issues before the full production submission.

---

### Risk 2: AI API Cost Overruns
**Likelihood:** Medium | **Impact:** Medium

**Scenario:** Faster-than-expected user growth, cache miss rates higher than projected, or a viral moment drives API call volume beyond the $0.04–$0.09/user/month steady-state estimate. At 1,000 MAU with poor cache performance, Claude costs alone could exceed $200–$300/month — against a projected MRR of $500–$1,000 in the same period.

**Mitigations:**
- The Upstash Redis ingredient analysis cache (keyed on ingredient fingerprint hash) is the primary cost control. Achieving the 80%+ cache hit rate target by Month 2 is essential — monitor cache hit rate weekly and optimize cache TTLs if below target.
- Skin Story generation (the most expensive AI call at ~$0.032/user/month) is Pro-only. At a 5% free-to-Pro conversion rate, only 5% of MAU generate Skin Story costs — the cost scales with the revenue.
- Hard rate limits on AI-calling Edge Functions: maximum 10 ingredient analysis calls per user per day, maximum 1 Skin Story generation per user per week. These limits are generous enough that real users never hit them; they prevent abuse and runaway costs from edge cases.
- Implement spend alerts in the Anthropic and OpenAI dashboards at $50 and $100 monthly spend. Do not wait for the monthly bill to discover an overrun.
- The on-device bundled conflict rules JSON means the most frequently triggered analysis (adding a product to a routine) has zero API cost for the majority of use cases. Claude is an enhancement, not the primary conflict detection mechanism.

---

### Risk 3: Low User Retention / Failed Habit Formation
**Likelihood:** High | **Impact:** High

**Scenario:** Users download GlowLog, add a few products, and churn before the app delivers meaningful value. The Skin Story engine requires 14 days of consistent logging to produce insights — if users churn before reaching that threshold, the app's most compelling value proposition is never experienced.

**Mitigations:**
- The "activated state" — a user with at least one routine scheduled and one skin log completed — must be achieved during or immediately after onboarding. Onboarding should not end at account creation; it should guide the user to their first routine in the same session.
- The home dashboard must show value immediately, even before 14 days of data. The streak counter, today's routine card, and quick-log button give the user a clear action every time they open the app — the app earns its place on the home screen by being useful daily.
- Grace-period streak logic prevents the streak-break discouragement that causes users to abandon habit-tracking apps after a missed day. The streak must feel achievable, not punishing.
- Push notifications for routine reminders are the primary re-engagement mechanism — but only for users who have set them up. The onboarding notification permission request must include a clear value proposition ("Get reminded when it's time for your retinol routine — never forget an active ingredient again").
- Monitor Day-7 retention weekly post-launch. If below 25%, conduct qualitative interviews with churned users via the beta survey before attempting to fix it algorithmically.

---

### Risk 4: Data Privacy Compliance (GDPR / CCPA)
**Likelihood:** Low-Medium | **Impact:** Very High

**Scenario:** GlowLog collects skin condition data from users in the EU and UK — a category that GDPR Article 9 classifies as special category health data. Non-compliance (missing consent, inadequate data subject rights implementation, or data breach without notification) carries fines up to 4% of annual global turnover or €20M.

**Mitigations:**
- Legal basis for processing special category data is **explicit consent** — obtained via a clear, plain-language consent screen during onboarding (not buried in Terms of Service). Consent must be freely given, specific, informed, and unambiguous. The consent screen explains exactly what data is collected (skin condition scores, logged breakouts, progress photos) and why (to generate your personal skin patterns and routine insights). The consent is stored with a timestamp.
- **Data Subject Rights implementation** (required for GDPR):
  - Right of access: data export (JSON) is available from Settings at any time, free of charge
  - Right to erasure: account deletion with complete data purge, confirmable within 30 days
  - Right to rectification: all logged data is editable by the user
  - Right to portability: export format is JSON (machine-readable)
- **CCPA:** California users have the right to know what personal information is collected. GlowLog's privacy policy must list all data categories. "Do Not Sell My Personal Information" is not directly applicable because GlowLog does not sell user data — but the privacy policy must state this explicitly.
- GlowLog does not share personal skin data with third parties. The only external data flows are: (a) anonymized/aggregated ingredient combination hashes to Upstash Redis as cache keys — no personal data; (b) ingredient lists (not linked to user identity) sent to Claude for analysis via server-side functions. Confirm with legal counsel that the Claude API data processing agreement covers this use case.
- Privacy policy published at a stable URL, linked from the App Store listing, the onboarding screen, and the app's Settings screen.
- As a solo indie developer, consider using a privacy policy generator (iubenda, Termly) to produce a GDPR/CCPA-compliant policy template, then review with a lawyer before launch.

---

### Risk 5: Technical Debt from Rapid MVP Development
**Likelihood:** High | **Impact:** Medium (grows over time)

**Scenario:** A 16-week solo build creates pressure to ship working code quickly, which naturally accumulates technical debt — skipped abstractions, hardcoded values, untested edge cases in complex logic (recurrence rule calculations, timezone handling), and missing error handling on background jobs. This debt is manageable at 100 users but becomes crippling at 1,000.

**Mitigations:**
- Three areas of the codebase are designated **no-debt zones** — code here must be written correctly the first time, with unit tests, because bugs here are invisible, trust-destroying, and hard to diagnose:
  1. Recurrence rule / next-due-date calculation (incorrect results break streaks silently)
  2. Subscription state and feature gating (incorrect results give free users Pro access or lock paying users out)
  3. Row-Level Security policies (a bug here exposes another user's skin data — a privacy breach)
- **Debt zones** — where intentional shortcuts are acceptable for v1 and must be documented:
  1. The community product database (manual entry covers the gap; proper community features are v1.1)
  2. Notification rescheduling robustness (best-effort at v1; more edge cases addressed post-launch)
  3. Advanced error handling in background jobs (Skin Story generation failures are logged, not alerting at v1)
- Maintain a **technical debt log** (a Notion page or GitHub Issues label) where every intentional shortcut is documented with the reason it was taken and the conditions under which it should be resolved. This prevents debt from becoming invisible.
- The codebase should have zero hardcoded API keys. All secrets in environment variables, all feature flags in a single configuration file.

---

### Risk 6: Ingredient Conflict Data Accuracy
**Likelihood:** Medium | **Impact:** High

**Scenario:** GlowLog flags a safe ingredient combination as a conflict (causing unnecessary user anxiety) or — worse — fails to flag a genuinely harmful combination (causing skin damage). Either outcome damages trust; the second carries potential liability.

**Mitigations:**
- The deterministic on-device bundled rules JSON is the authoritative conflict source — Claude is only used to explain and elaborate, never to override the binary conflict flag. This means the quality of conflict detection is bounded by the quality of the curated rules JSON, not by Claude's confidence.
- The bundled rules JSON is sourced from INCIDecoder, peer-reviewed dermatology literature, and established cosmetic chemistry references. Each conflict pair in the JSON includes a source citation so the developer can verify and update entries over time.
- The golden test set (30 ingredient combination scenarios: 10 confirmed conflicts, 10 known-safe combinations, 10 complex multi-product routines) is re-run against the production system before every rules JSON update.
- All conflict warnings in the UI include a disclaimer: "This is informational guidance based on formulation chemistry. Reactions vary by individual skin and product concentration. Consult a dermatologist for personalized advice."
- The "myth / commonly misunderstood" conflict tier explicitly calls out interactions (like Vitamin C + Niacinamide) that are frequently overstated in online skincare communities — educating users rather than perpetuating anxiety.
- User-reported false positives or missed conflicts can be submitted via a simple "Flag this result" button in the conflict guide. These reports feed into rules JSON review cycles.

---

### Risk 7: Barcode Scan Failure Rate Undermining Core UX
**Likelihood:** Medium | **Impact:** Medium

**Scenario:** Open Food Facts coverage for skincare products — particularly K-beauty, indie brands, and non-Western markets — is significantly lower than for food products. If barcode scans fail more than 30% of the time for GlowLog's target audience (K-beauty followers, ingredient-conscious consumers), the scan feature erodes trust rather than building it.

**Mitigations:**
- Manual entry is always immediately available as the fallback — the barcode scan screen has a prominent "Enter Manually" button that is never hidden or deprioritized. A scan miss is a 2-tap path to manual entry, not a dead end.
- The 5-step barcode fallback chain (local cache → Open Food Facts → community database → Vision extraction [v1.1] → manual entry) ensures every scan attempt has a graceful outcome.
- During beta testing (Week 14), track barcode scan success rates per brand and region. If success rates for K-beauty brands are below 50%, prioritize sourcing or manually curating ingredient data for the top 20 most common K-beauty products and adding them to the bundled local cache before public launch.
- The product entry success metric (≥ 70% barcode match rate on tested products) is a beta phase gate — if not met, launch is delayed until either the data gap is filled or the manual entry UX is further streamlined.

---

*End of GlowLog Product Brief — Part 2 (Sections 6–13)*

*This document completes the GlowLog product specification. Together with Part 1 (Sections 1–5), this brief provides a complete, production-ready reference for a solo developer building GlowLog from initialization to App Store launch.*