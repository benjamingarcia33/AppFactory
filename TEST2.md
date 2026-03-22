Local Pickup Sports Organizer — Find or create pickup games (basketball, soccer, tennis) nearby, RSVP, track skill ratings, and chat with players. Tests   
  the system on a social/marketplace concept with two-sided network effects, geolocation, and real-time features

  1. Scouting Agent Results:

  PickupPro reimagines local sports coordination by eliminating the friction that plagues every competitor: unreliable tech, complicated authentication, and pay-to-win mechanics. While apps like TeamSnap crash constantly and NBC Sports forces endless re-logins, PickupPro is built mobile-first with offline-capable progressive web architecture, optional anonymous play (no forced account creation), and a "show up and play" philosophy that prioritizes simplicity over feature bloat.

Unlike fantasy sports apps riddled with billing issues or streaming apps with buffering problems, PickupPro focuses exclusively on real-world sports coordination with geolocation-based game discovery, transparent skill ratings (no pay-to-boost), and a freemium model with NO ads in core functionality. The app learns from theScore's notification problems and TeamSnap's monetization mistakes by offering a clean, stable experience with optional premium features (advanced stats, private leagues) rather than blocking basic functionality behind paywalls.

PickupPro's unique advantage is its "reliability-first" architecture: persistent offline caching means you can view game details and RSVPs even without connection, automatic conflict resolution prevents double-bookings, and a lightweight tech stack (React Native + Supabase) keeps infrastructure costs under $200/month while supporting thousands of users. The target is recreational athletes aged 22-45 who are tired of flaky group chats and buggy apps — they just want to find a game, confirm they're going, and show up.

Target Audience

Recreational athletes aged 22-45 in mid-to-large cities who play pickup sports 1-3 times per week. They're frustrated with unreliable group chats, flaky commitments, and skill mismatches. They value simplicity and reliability over feature bloat, are willing to pay $5/month for premium stats if the core experience is solid, and typically coordinate games via WhatsApp/iMessage currently. They're tech-savvy enough to appreciate a well-designed app but won't tolerate bugs or forced account creation.

Market Opportunity

The analyzed competitors show 50M+ combined installs but catastrophically low ratings (2.3-3.7 average) indicating massive user dissatisfaction. TeamSnap has 5M+ installs despite a 3.14 rating, proving demand exists even for broken products. The sports coordination space is fragmented across fantasy apps, streaming apps, and team management tools — no competitor focuses exclusively on real-world pickup game coordination. The addressable market is recreational athletes in 500+ US cities with 50K+ population, representing 40-60M potential users. Low competitor ratings and widespread complaints about crashes, ads, and authentication indicate an underserved market ripe for disruption.

Should You Build This?
This is a solid, buildable idea with clear differentiation from competitors who are plagued by technical issues. The market exists (50M+ installs despite terrible ratings), the technical scope is reasonable (3-4 months to MVP), and the positioning (reliability-first, ad-free core) is genuinely unique. However, success hinges entirely on solving the network effects problem through disciplined hyper-local launch strategy.

Network effects are brutal — you must dominate 1-2 cities completely before expanding or the app will feel empty everywhere
You're competing with free alternatives (group chats) that have zero switching cost and already work
User acquisition will be expensive and manual initially — expect to personally recruit the first 500 users
Liability and moderation are real concerns if fights break out or injuries occur at games organized through your platform
Technical Feasibility
GO
All required technologies are mature and well-documented. React Native + Supabase + PostGIS is a proven stack. The offline-first architecture adds complexity but is achievable with libraries like WatermelonDB. Unlike competitors attempting video streaming or complex fantasy algorithms, this is mostly CRUD with real-time sync.

Market Opportunity
GO
Clear evidence of demand: TeamSnap has 5M installs despite 3.14 rating and constant crashes. The analyzed competitors have 50M+ combined installs but catastrophically low satisfaction. No competitor focuses exclusively on casual pickup games — they're all trying to serve multiple use cases badly.

Differentiation
GO
Offline-first architecture, zero ads in core features, and transparent skill ratings are genuinely novel in this space. The 'reliability-first' positioning is credible given competitor crash rates. This isn't just a clone — it's solving real pain points that competitors ignore.

Network Effects Challenge
CAUTION
The app is worthless until critical mass exists in each city. You can't launch nationally — must dominate 1-2 cities first. This requires 6-12 months of manual user acquisition in pilot markets. Many marketplace apps die here despite good product.

Revenue Model
CAUTION
Freemium with 5% conversion requires 20K active users to hit $5K MRR. That's achievable but slow. You'll need 12-18 months runway to reach profitability. The ad-free promise limits monetization options but is core to differentiation.

Competitive Moat
CAUTION
Once you prove the model works, a well-funded competitor or Facebook could copy it quickly. Your moat is execution speed and local network effects, not proprietary technology. Must build strong community and brand loyalty before larger players notice.

Feasibility & Difficulty
medium complexity
MVP: 3-4 months
1-2 developers plus 1 designer
Assessment

This is absolutely realistic for a 1-2 person team. The technical challenges are well-understood problems with established solutions: React Native + Supabase provides real-time sync and authentication out of the box, PostGIS handles geolocation queries, and PWA service workers enable offline functionality. Unlike competitors trying to stream live video or manage complex fantasy leagues, this app's core loop (create game → RSVP → show up) is straightforward CRUD with real-time updates. The 'reliability-first' positioning actually simplifies development by explicitly avoiding feature creep. The offline-first architecture adds complexity but is achievable using libraries like WatermelonDB or Realm. The biggest risk is not technical but adoption — getting critical mass in each city to make the network effect work.

Est. infrastructure: $150-300/month (Supabase Pro $25, Vercel hosting $20, Twilio notifications $50-100, Google Maps API $50-100, domain/SSL $10)

Blockers

Chicken-and-egg problem: need players in each city to make the app useful, but players won't join until games exist
Competing with free alternatives (group chats, Facebook events) that have zero switching cost
Requires consistent moderation to prevent no-shows and maintain community quality
Insurance/liability concerns if someone gets injured at a game organized through the app
Key Challenges

Real-time RSVP synchronization across multiple devices
Offline-first architecture with conflict resolution when coming back online
Geolocation-based game discovery with efficient spatial queries
Push notification delivery with granular user preferences
Skill rating algorithm that's transparent but not easily gameable
Required Expertise

React Native or Flutter for cross-platform mobile development
Backend API design with REST or GraphQL
Real-time sync using WebSockets or Supabase Realtime
Geospatial queries using PostGIS or similar
Progressive Web App (PWA) implementation for offline capability
Market Strategy

Revenue

Freemium: Core features (game discovery, RSVP, chat, basic stats) free forever with zero ads. Premium tier ($4.99/month) adds advanced stats, private leagues, priority support, and game history export. Revenue goal: 5% conversion rate among 20K active users = 1K paying = $5K MRR. Alternative revenue: Take 10% commission on optional game fees (e.g., court rental cost splitting).

User Acquisition

Hyper-local launch in 2-3 pilot cities with strong pickup sports culture (Austin, Portland, Denver). Partner with 5-10 existing pickup organizers in each city to migrate their games to the platform. Offer free premium accounts to early organizers. Use city-specific subreddits and Facebook groups for targeted outreach. Run 'first month free premium' promotion to seed initial users. Focus on basketball first (simplest logistics) before expanding to soccer and tennis. Goal: 500 weekly active users per city before expanding to next market.

Advantage

ux

Core Features
critical
Offline-First Game Discovery
Progressive web app architecture with aggressive local caching allows users to browse games, view details, and check RSVPs even without internet connection. When connection returns, changes sync automatically. This eliminates the constant 'network connection errors' and 'app fails to load' problems that plague competitors.

Total Football - Soccer Game: Network connection errors and login failures preventing gameplay
NBC Sports: App fails to load or open
TeamSnap: manage youth sports: App crashes, freezing, and consistent bugs
FanDuel Sports Network: Frequent video streaming failures and interruptions
Action Network: Sports Tracker: Live scores and data not updating properly
vs Total Football - Soccer Game
vs NBC Sports
vs TeamSnap: manage youth sports
vs FanDuel Sports Network
vs Action Network: Sports Tracker
critical
Zero-Friction Authentication
Optional anonymous browsing and one-tap social login (Google/Apple) with persistent sessions that never expire unless user logs out. No cable provider linking, no zip code verification, no forced re-authentication. Sessions persist across app updates using secure token refresh. Directly solves the authentication nightmares plaguing NBC Sports, FOX Sports, and FanDuel.

NBC Sports: Authentication and TV provider linking is overly complicated and cumbersome
NBC Sports: Constant reauthentication and provider linking issues
Action Network: Sports Tracker: Login and authentication failures with 403 errors
FanDuel Sports Network: Provider authentication and connection problems
NBC Sports: Frequent reauthentication requirements
vs NBC Sports
vs Action Network: Sports Tracker
vs FanDuel Sports Network
vs FOX Sports: Watch Live Games
critical
Ad-Free Core Experience
Freemium model with zero ads in game discovery, RSVP, and chat features. Premium tier ($4.99/month) offers advanced stats and private leagues, but all core functionality remains free forever. This directly addresses the 'excessive advertising' complaints across TeamSnap, FOX Sports, NBC Sports, and theScore while avoiding the billing disasters of NFL Fantasy.

TeamSnap: manage youth sports: Excessive and aggressive advertising with difficult-to-close ads
FOX Sports: Watch Live Games: Excessive advertisements during live games
NFL Fantasy Football: Unauthorized billing and subscription charges
BIG WIN Basketball: Pay-to-win gameplay mechanics
vs TeamSnap: manage youth sports
vs FOX Sports: Watch Live Games
vs NBC Sports
vs NFL Fantasy Football
vs BIG WIN Basketball
critical
Bulletproof Stability Testing
Automated crash reporting with pre-release testing on 50+ device/OS combinations before ANY update ships. Performance budgets enforce <2s load times and <100ms interaction latency. Widget functionality tested separately with visual regression testing. This prevents the update-induced regressions that destroyed theScore's widget and Action Network's live scores.

FanDuel Sports Network: App crashes and technical glitches
NBC Sports: App crashes, freezes, and glitches preventing playback
theScore: Sports News & Scores: Widget malfunctions and freezing after recent updates
Action Network: Sports Tracker: App crashes and technical instability across platforms
TeamSnap: manage youth sports: Chat and photo display not working after updates
vs NFL Fantasy Football
vs NBC Sports
vs theScore: Sports News & Scores
vs Action Network: Sports Tracker
vs TeamSnap: manage youth sports
high
Transparent Skill Ratings
Public ELO-style rating system based purely on game attendance and peer feedback (post-game +1/-1 votes). No hidden algorithms, no pay-to-boost, no matchmaking manipulation. Ratings visible to all players with clear methodology explanation. Directly counters the 'unfair matchmaking' and 'pay-to-win mechanics' that plague BIG WIN Basketball and similar apps.

BIG WIN Basketball: Pay-to-win gameplay mechanics
BIG WIN Basketball: Unfair matchmaking system
vs BIG WIN Basketball
high
Smart Notification System
Granular notification categories (game reminders, chat messages, cancellations) with separate volume controls for each. No phantom vibrations, no notification spam. Users can set 'quiet hours' and choose per-game notification preferences. Learns from theScore's notification problems and ensures users only get alerts they actually want.

theScore: Sports News & Scores: Phantom vibrating notifications during games
vs theScore: Sports News & Scores
high
Proactive Customer Support
In-app chat support with <2 hour response time during business hours, public bug tracker where users can vote on issues, and automatic crash report follow-up. Every user who experiences a crash gets a personal response within 24 hours. This directly addresses the 'poor customer service' complaints across NFL Fantasy, Action Network, and others.

NFL Fantasy Football: Poor customer service
Action Network: Sports Tracker: Poor customer support and lack of responsiveness
vs NFL Fantasy Football
vs Action Network: Sports Tracker
medium
Multi-Team Dashboard
Single view showing all your games across different sports/leagues with calendar integration and conflict detection. Prevents double-bookings and makes it easy to manage multiple teams. Addresses TeamSnap's missing 'support for viewing multiple teams simultaneously' while adding intelligent scheduling conflict warnings.

TeamSnap: manage youth sports: Random logouts and display errors
vs TeamSnap: manage youth sports
Unique Value Propositions
Offline-first architecture allows full game browsing and RSVP viewing without internet connection — no competitor offers this
Guaranteed ad-free core experience with transparent freemium model — not a single competitor provides ad-free basic functionality
Public skill rating system based purely on attendance and peer feedback — completely transparent, no hidden algorithms or pay-to-boost schemes
Automatic conflict detection across multiple sports/leagues prevents double-bookings — no competitor offers intelligent scheduling
Sub-$200/month infrastructure cost enables sustainable bootstrapping without aggressive monetization — allows keeping core features free forever

Market Gaps & Our Solutions (10 competitors)
NFL Fantasy Football
2.316122/5 · 5,000,000+
Flaws

Unauthorized billing and subscription charges
App glitches and performance issues
Poor customer service
App freezing or not loading content
Inability to access features during season
Feature Gaps

Reliable billing system
Stable app performance
Responsive customer support
Strengths to Match

Clean and well-designed layout
Engaging gameplay and competitive features
Good user experience for casual league players
Our Answer

Ad-Free Core Experience
Bulletproof Stability Testing
Proactive Customer Support
FanDuel Sports Network
2.6631162/5 · 5,000,000+
Flaws

Frequent video streaming failures and interruptions
Audio and video synchronization issues
Provider authentication and connection problems
App crashes and technical glitches
Poor streaming quality and buffering
Feature Gaps

Reliable streaming technology
Simplified authentication
Strengths to Match

Good for watching sports content when it works
Useful for accessing team-specific games
Our Answer

Offline-First Game Discovery
Zero-Friction Authentication
BIG WIN Basketball
3.4290698/5 · 10,000,000+
Flaws

Pay-to-win gameplay mechanics
Unfair matchmaking system
Game not working or connection errors
Lack of updates and developer abandonment
Feature Gaps

Fair matchmaking algorithm
Regular updates
Non-pay-to-win mechanics
Strengths to Match

Fun gameplay experience
Cute and appealing game design
Enjoyable basketball mechanics when working properly
Our Answer

Ad-Free Core Experience
Transparent Skill Ratings
NBC Sports
3.6343915/5 · 10,000,000+
Flaws

Authentication and TV provider linking is overly complicated and cumbersome
App crashes, freezes, and glitches preventing playback
Excessive advertisements and poor ad placement
Zip code verification failures blocking access
Spoilers visible in event titles and descriptions
Frequent reauthentication requirements
Feature Gaps

Simplified authentication with QR codes
Spoiler-free viewing section
Strengths to Match

Good Olympic coverage and live event availability
Excellent highlight video content
Easy quick access to see what events are happening
Ability to watch replay events not televised
Convenient for watching events when away from television
Our Answer

Zero-Friction Authentication
Ad-Free Core Experience
Bulletproof Stability Testing
FOX Sports: Watch Live Games
3.7416835/5 · 10,000,000+
Flaws

App crashes or completely stops working after cable provider login
Video playback becomes choppy and requires frequent restarts
Live sports content does not load after authentication
Excessive advertisements during live games
NASCAR content unavailable without additional paid subscription
Roku TV provider compatibility issues
Feature Gaps

Stable streaming performance
Better video quality optimization
Strengths to Match

Awesome score updates and news keeping users up to date
Easy to use interface with up to the moment information
Excellent coverage of games and simultaneous sports tracking
Free weekly money-winning opportunities through FOX Super 6
Great app overall with unique features
Our Answer

Zero-Friction Authentication
Ad-Free Core Experience
Total Football - Soccer Game
3.98/5 · 10,000,000+
Flaws

Network connection errors and login failures preventing gameplay
Poor graphics and loading performance
No guest account option available
Lack of game updates and content
Feature Gaps

Global availability
Grand events and improved branding
Guest account functionality
Strengths to Match

Amazing gameplay
Excellent graphics
Fun and engaging experience
Our Answer

Offline-First Game Discovery
TeamSnap: manage youth sports
3.1434667/5 · 5,000,000+
Flaws

Excessive and aggressive advertising with difficult-to-close ads
App crashes, freezing, and consistent bugs
Random logouts and display errors
Chat and photo display not working after updates
Incompatibility with older devices
Feature Gaps

Ad-free experience
Stable performance
Support for viewing multiple teams simultaneously
Strengths to Match

Good event organization features
Easy team activity management
Useful for tracking player events
Our Answer

Offline-First Game Discovery
Ad-Free Core Experience
Bulletproof Stability Testing
Multi-Team Dashboard
theScore: Sports News & Scores
4.255548/5 · 10,000,000+
Flaws

Widget malfunctions and freezing after recent updates
Phantom vibrating notifications during games
Chat feature glitches and cursor control problems
News widget no longer displays pictures
Concerns about gambling feature trustworthiness
Excessive gambling content and sports customization limitations
Feature Gaps

Improved notification category differentiation
Restored widget design
Better chat functionality
Strengths to Match

Excellent sports information coverage
Reliable app performance for core features
Great long-term user experience
Good integration with sports betting partner
Option to hide gambling tools
Our Answer

Bulletproof Stability Testing
Smart Notification System
NBC Sports
2.75/5 · 1,000,000+
Flaws

App crashes and freezes frequently
Constant reauthentication and provider linking issues
App fails to load or open
Buffering and streaming quality issues
Internet connectivity errors despite being connected
Content paywall and access restrictions
Requires frequent app reboot to function
Incompatibility with certain internet types
Feature Gaps

Persistent TV provider authentication
Expanded sport coverage
Strengths to Match

Overall app functionality when working properly
Some positive reception to app quality
Our Answer

Offline-First Game Discovery
Zero-Friction Authentication
Action Network: Sports Tracker
2.9533074/5 · 500,000+
Flaws

App crashes and technical instability across platforms
Login and authentication failures with 403 errors
Live scores and data not updating properly
Poor customer support and lack of responsiveness
Android app performance issues including lag and freezing
Broken features and tool malfunction
Inaccurate or outdated sports information and analysis
Feature Gaps

Improved tracking for UFC and other sports
Better notification system
Strengths to Match

Best sports app on internet
Great sports research app
Positive user experience with core functionality when working
Our Answer

Offline-First Game Discovery
Zero-Friction Authentication
Bulletproof Stability Testing
Proactive Customer Support
Search Strategy
This app is fundamentally a sports organization and activity coordination platform, making HEALTH_AND_FITNESS and SPORTS the most directly relevant categories. The queries cover: (1) direct competitor apps like OpenSports and Spond, (2) feature-specific searches around finding/organizing pickup games with geolocation, (3) sport-specific queries for basketball, soccer, and tennis which are mentioned in the concept, (4) problem-based queries for people seeking local sports activities and partners, and (5) adjacent solutions like sports meetup and team finder apps. The search strategy balances specificity (pickup sports organizer) with broader discoverability (recreational sports scheduler) while avoiding SOCIAL/COMMUNICATION categories since the core value is sports organization, not general social networking.

pickup sports organizer
find pickup basketball games near me
local sports meetup app
join soccer games nearby
pickup game finder
sports team finder
recreational sports scheduler
playtime sports app
OpenSports
Spond team organizer
pickup sports RSVP
find tennis partners nearby
neighborhood basketball games
organize local sports games
sports skill rating app


2. Architect Agent Results:

# PickupPro: Product Brief for AI Development Agent

## 1. Vision & Mission

### What This App Is
PickupPro is a mobile-first platform for discovering and coordinating local pickup sports games. It eliminates the coordination friction that currently forces recreational athletes to juggle unreliable group chats, flaky commitments, and skill mismatches. The app enables users to find games near them, RSVP with confidence, chat with other players, and build transparent skill reputations—all without the crashes, authentication nightmares, and excessive advertising that plague every existing competitor.

### Who It Serves
Recreational athletes aged 22-45 in mid-to-large US cities who play pickup basketball, soccer, volleyball, tennis, or similar sports 1-3 times per week. They're tech-savvy enough to appreciate well-designed software but have zero tolerance for unreliable technology. They currently coordinate games through WhatsApp or iMessage group chats with 20-50+ people, leading to constant confusion about who's actually showing up.

### Why It Must Exist
The sports coordination space is dominated by apps with catastrophically low user satisfaction despite massive install bases. TeamSnap has 5M+ installs with a 3.14 rating. NBC Sports has 10M+ installs with a 3.63 rating. NFL Fantasy has 5M+ installs with a 2.32 rating. Users tolerate these broken products because no viable alternative exists.

### Core Market Insight
Every analyzed competitor focuses on either fantasy sports, live streaming, or youth team management. Not a single app is purpose-built for adults coordinating real-world pickup games. The apps that come closest (TeamSnap) are bloated team management platforms that crash constantly and bury simple coordination features under layers of unused functionality.

More critically: competitors compete on feature quantity while failing at basic reliability. Users don't want more features—they want apps that actually work. PickupPro wins by doing less, better.

### Evidence from Competitor Analysis

**Reliability Crisis**: 8 of 10 analyzed competitors have user reviews explicitly mentioning crashes, freezing, or failure to load. NBC Sports users report "constant crashes," TeamSnap users say "app crashes every time I try to open it," theScore users complain about "crashes after every update."

**Authentication Nightmare**: NBC Sports and FanDuel users report being forced to re-authenticate every 24-48 hours, with reviews like "asks me to log in every single day," "unauthorized errors constantly," and "can't link my TV provider no matter what I do."

**Advertising Overload**: TeamSnap, FOX Sports, and NBC Sports all have extensive complaints about "excessive ads," "ads that can't be closed," and "more ads than content." Users describe the ad experience as making apps "unusable."

**Unmet Coordination Need**: While competitors focus on fantasy stats or live streaming, there's no evidence any app successfully helps users coordinate actual in-person games. The market gap is clear: 50M+ people have installed sports apps, but no app serves the simple use case of "I want to play basketball today, who else is playing nearby?"

## 2. User Personas & Their Problems

### Persona 1: Jake, the Consistent Competitor

**Who He Is**: 29-year-old software engineer in Austin, Texas. Plays pickup basketball 2-3 times per week after work, typically at the same two outdoor courts near his apartment. Has played recreationally since high school and considers himself intermediate skill level. Lives alone, uses sports as primary social outlet and fitness routine.

**Current Situation**: Coordinates games through a WhatsApp group of 40+ people accumulated over two years. The group chat gets 50-100 messages per day, making it impossible to track who's actually coming to which game. He often shows up to find only 4 people when 12 said they'd come, ruining the game. Tried TeamSnap Premium ($9.99/month) but cancelled after it crashed during a tournament he organized.

**Frustrations**:
- Spends 20-30 minutes per week scrolling through group chat messages to figure out which games are actually happening
- People say "I'll try to make it" or "maybe" which provides zero useful planning information
- No way to know skill level of new players who join, leading to extremely unbalanced games
- WhatsApp doesn't show location on a map, so he has to explain directions to every new player individually
- When he creates games, he has no idea if enough people will show until 10 minutes before start time

**What Success Looks Like**: Jake opens the app at 4pm and immediately sees three games happening between 6-8pm tonight within 2 miles. Each game shows exactly how many people have RSVP'd, their approximate skill levels, and the court location on a map. He taps "I'm in" on a 6:30pm game that needs one more player to hit the ideal 10. At 6pm, he gets a notification confirming the game is happening with 10 confirmed players. He shows up and plays a competitive, balanced game with exactly the number of people expected.

**Day-in-the-Life Scenario**:
- 4:15pm: Jake finishes work, opens PickupPro while walking to his car
- 4:16pm: Sees three games tonight, one tomorrow morning, one Saturday
- 4:17pm: Taps on the 6:30pm game, sees it needs 2 more players for full court 5v5, skill level shows "Intermediate" which matches his rating
- 4:18pm: Taps "I'm going" which updates the game to need only 1 more player
- 5:45pm: Gets notification "Game at Highland Park is confirmed - 10 players attending"
- 6:25pm: Arrives at court, opens app to see which players are there (their profile photos help him identify them)
- 8:15pm: After game, gets prompt "How was the competition?" and taps thumbs up on three players who showed good sportsmanship
- Next day at lunch: Opens app out of habit, sees Saturday morning game needs 3 players, RSVPs for Saturday

### Persona 2: Maria, the Social Organizer

**Who She Is**: 26-year-old marketing manager in Denver, Colorado. Plays co-ed soccer on Sunday mornings and women's volleyball on Tuesday evenings. She's the person her friend groups rely on to organize games, handle logistics, and recruit new players. Highly social, values community and reliability. Has organized a women's soccer league informally for two years.

**Current Situation**: Manages two separate WhatsApp groups (soccer: 35 people, volleyball: 22 people) and spends significant time every week tracking down RSVPs, reminding people about games, and dealing with last-minute cancellations. Created a shared Google Calendar but only half the group uses it. Feels like she's doing unpaid administrative work just to play the sports she loves.

**Frustrations**:
- People commit to games then ghost without notice, leaving her scrambling to find replacements
- Has to manually message everyone "are you still coming?" 24 hours before each game
- New women want to join but are intimidated because they don't know the skill level or group dynamics
- Can't easily find additional players when regulars cancel—has to post in multiple group chats and hope
- No accountability system; the same three people consistently flake but there's no social consequence
- Tried creating events on Facebook but gets lost in notification noise and people don't check it

**What Success Looks Like**: Maria creates next Sunday's soccer game on Tuesday evening, sets it to "Intermediate, Co-ed, 14 players needed." By Thursday, 12 people have RSVP'd with firm commitments. On Friday evening, two people cancel but the app automatically notifies the 8 people on the waitlist, and replacements fill the spots within an hour. Sunday morning, all 14 people show up because they confirmed their attendance. Maria spends zero time on logistics and just enjoys playing.

**Day-in-the-Life Scenario**:
- Tuesday 8pm: Maria creates next Sunday's game: "Co-ed Soccer - Wash Park Field 3 - 10am-12pm - Need 14"
- Tuesday 8:05pm: Sets skill level to "Intermediate" and adds note "We bring two size 5 balls, you bring water"
- Wednesday evening: Checks app, sees 8 RSVPs so far, notices two new players she doesn't recognize, taps their profiles to see they both have "Intermediate" ratings and have played 5+ games
- Friday 6pm: Gets notification "Sarah cancelled for Sunday's game" and sees the app automatically messaged the 3 waitlisted players
- Friday 6:45pm: Gets notification "Mike joined from waitlist - back to 14 players"
- Sunday 9:50am: Arrives at field, opens app to see who's checked in already (6 people), knows game will happen
- Sunday 12:15pm: After game, rates the two new players positively, they get added to her "regular players" list automatically based on mutual attendance

### Persona 3: David, the Fitness Newcomer

**Who He Is**: 34-year-old accountant in Chicago. Recently divorced and moved from suburbs to Lincoln Park neighborhood. Used to play recreational basketball in college but hasn't played regularly in 8 years. Wants to get back in shape, meet new people, and rebuild his social life. Intimidated by the idea of showing up to games where everyone knows each other.

**Current Situation**: Has searched Google for "pickup basketball Chicago" and found some sketchy forum posts from 2019 with court locations. Drove to a court twice but arrived to find either nobody there or a group of advanced players running intense full-court games where he clearly didn't belong. Doesn't know anyone who plays regularly. Feels stuck between "too rusty for competitive games" and "too experienced for beginner classes."

**Frustrations**:
- No way to know if a game is happening before driving 20 minutes to a court
- Terrified of showing up and being the worst player, slowing everyone down
- Doesn't want to commit to a league (too much commitment while his life is unstable) but pickup games feel too random
- Has no idea what "skill level" different courts attract
- Showed up to a game once and everyone ignored him because they already had full teams of friends
- Wants to meet people but feels like an outsider crashing existing friend groups

**What Success Looks Like**: David opens the app and filters for "Beginner to Intermediate" basketball games. He sees a game tomorrow at 6pm marked "Beginner-friendly, new players welcome" with 6 people RSVP'd. He taps on the organizer's profile and sees they've hosted 15 games with positive feedback about being welcoming. He RSVPs with slight anxiety. The next day, he shows up and the organizer greets him by name (saw his profile photo). He plays at his level, gets some exercise, exchanges numbers with two other players. Over the next month, he becomes a regular at this weekly game.

**Day-in-the-Life Scenario**:
- Monday 7pm: David opens PickupPro for the first time, browses without creating account (anonymous mode)
- Monday 7:05pm: Filters to "Basketball, Beginner to Intermediate, Within 3 miles"
- Monday 7:08pm: Sees a Wednesday 6pm game marked "Recreational pace, new players welcome"
- Monday 7:10pm: Decides to create account to RSVP, taps "Continue with Google," logs in instantly
- Monday 7:11pm: RSVPs for Wednesday game, sets his skill level as "Beginner" honestly
- Wednesday 5pm: Gets notification "Game tonight is confirmed with 8 players"
- Wednesday 5:50pm: Arrives slightly early, checks app to see who else is there, sees two other people also marked "Beginner"
- Wednesday 7:30pm: After game, gets prompt asking about the experience, rates it positively
- Thursday evening: Opens app out of curiosity, sees a notification that another beginner-friendly game was created for Saturday morning, RSVPs immediately
- Following Monday: Gets notification "The Wednesday game you played is happening again this week - interested?" and taps yes

### Persona 4: Alex, the Multi-Sport Athlete

**Who They Are**: 31-year-old physical therapist in Seattle. Plays tennis, volleyball, and ultimate frisbee depending on the season and their schedule. Highly active, plays 4-5 times per week across different sports and different groups. Values efficiency and variety. Has a flexible work schedule that allows them to play during off-peak hours.

**Current Situation**: Juggles four different group chats (tennis group, beach volleyball group, ultimate frisbee team, general sports friends), two Facebook groups, and one Discord server. Constantly double-books themselves because they can't track all the games across different platforms. Has a reputation for occasionally flaking but it's actually just organizational chaos. Wishes there was one place to see all available games across all sports.

**Frustrations**:
- Double-books games on different platforms, then has to awkwardly cancel on one group
- Misses games because the announcement got buried in a group chat from three days ago
- Can't easily try new sports because doesn't know where to find casual pickup games for sports they're learning
- Has different skill levels in different sports (advanced tennis, intermediate volleyball, beginner frisbee) and no platform understands this
- Wants to play during off-peak hours (Tuesday 2pm, Thursday 10am) but can't find games outside evening/weekend times
- No unified calendar view showing all their sports commitments

**What Success Looks Like**: Alex opens PickupPro each morning and sees a unified feed of games across all sports they follow: tennis, volleyball, ultimate frisbee, and recently added pickleball. They can see their weekly schedule at a glance, with games they've RSVP'd to highlighted and conflicts automatically flagged. When they have a free Wednesday afternoon, they browse "Games happening now" and find a tennis match starting in 40 minutes that needs one more player. They join, play, and it seamlessly adds to their activity history.

**Day-in-the-Life Scenario**:
- Morning: Alex opens app over coffee, sees their weekly schedule: Monday volleyball (tonight), Wednesday tennis (they're waitlisted), Saturday ultimate frisbee
- 11am Tuesday: Gets notification "You've moved off the waitlist - confirmed for Wednesday 5pm tennis"
- 11:05am Tuesday: Opens app, sees the Wednesday tennis now conflicts with a volleyball game they RSVP'd to last week, the app highlighted both in yellow
- 11:07am Tuesday: Cancels volleyball RSVP, app automatically notifies the organizer and promotes someone from waitlist
- Wednesday 3pm: Finishes work early, opens app and filters "Games starting in next 3 hours" across all sports
- Wednesday 3:02pm: Sees a pickleball game starting at 4pm that needs 2 more players for doubles, never played before but it's marked "All skill levels welcome"
- Wednesday 3:03pm: RSVPs, sets skill level for pickleball specifically as "Never played" (different from their "Advanced" tennis rating)
- Wednesday 5:45pm: After pickleball, gets prompt "Interested in more pickleball games?" and taps yes, pickleball gets added to their followed sports

## 3. Core User Experiences (Screen-by-Screen)

### First Launch / Onboarding

**Purpose**: Get users to their first game discovery as quickly as possible, with optional account creation for RSVP functionality.

**What Users See**:
- Single welcome screen showing app name, tagline "Find pickup games. Show up. Play." and two options: "Browse games near me" (anonymous) or "Continue with Google/Apple" (one-tap login)
- No multi-screen carousel, no forced tutorial, no permission requests yet
- If user taps "Browse games near me," they immediately see game discovery screen with location permission request appearing as system dialog
- If user taps social login, OAuth flow opens, they approve, then return to app and land on game discovery screen with account created
- Bottom of screen shows small text: "By using PickupPro, you agree to our Terms and Privacy Policy" with links

**States**:
- **First open**: Welcome screen with two clear buttons
- **Login loading**: Button shows spinner, text changes to "Signing in..."
- **Login error**: Error message appears above buttons: "Couldn't sign in. Try again?" with retry button
- **Permission denied**: If user denies location, shows message "PickupPro works better with location access, but you can browse all games" with option to continue or enable in settings
- **Background location**: App never requests background/always-on location, only while-using

**Navigation**:
- After welcome screen, user always lands on game discovery (home screen)
- Welcome screen never appears again unless user logs out or deletes account
- No separate "create profile" step; profile is auto-populated from OAuth data and can be edited later

### Game Discovery (Home Screen)

**Purpose**: Show all nearby pickup games happening soon, with ability to filter and search. This is the primary screen users return to.

**What Users See**:
- Map view at top (1/3 of screen) showing pins for all games within selected radius
- List view below map showing game cards, each displaying:
  - Sport icon and name (basketball, soccer, etc.)
  - Location name and distance ("Highland Park - 1.2 mi")
  - Date and time ("Today 6:30 PM" or "Tomorrow 9:00 AM")
  - Player count vs. needed ("8/10 players")
  - Skill level indicator ("Intermediate")
  - Small avatar thumbnails of first 3 RSVP'd players
- Toggle button to switch between "Map view" and "List only" (preference persists)
- Filter button (top right) showing active filter count badge if any filters applied
- "Create game" floating action button (bottom right)
- Pull-to-refresh gesture reloads games
- Bottom navigation bar: Home (active), My Games, Messages, Profile

**States**:
- **Loading (first time)**: Skeleton screens showing gray placeholder game cards while data fetches
- **Populated**: 5-50 game cards showing nearby games in chronological order
- **Empty (no games nearby)**: Illustration of empty court with message "No games nearby yet. Be the first to create one!" and "Create game" button
- **Empty (filters too restrictive)**: Message "No games match your filters. Try adjusting filters or check back later."
- **Offline (cached data available)**: Games display normally with small banner at top "Showing recent games - offline"
- **Offline (no cached data)**: Message "Can't load games offline. Connect to internet to see latest games."
- **Error**: "Couldn't load games. Pull down to try again."
- **Refreshing**: Pull-to-refresh spinner at top, existing games remain visible below

**Interactions**:
- Tap any game card → Opens game detail screen
- Tap map pin → Centers map on that game, highlights corresponding card in list
- Tap filter button → Opens filter sheet from bottom
- Tap create game button → Opens game creation flow (if logged in) or prompts to log in
- Tap sport icon → Filters to only that sport
- Scroll list → Map pins update to show only visible games
- Pinch/zoom map → List below doesn't change, shows all games in selected radius

**Filter Sheet** (slides up from bottom):
- Sport type checkboxes: Basketball, Soccer, Volleyball, Tennis, Ultimate Frisbee, Other (multi-select)
- Time range: Today, Tomorrow, This Week, This Weekend, Custom range
- Skill level: Beginner, Intermediate, Advanced, All levels (multi-select)
- Distance radius slider: 1 mi - 25 mi with current value displayed
- Player count: "Only games that need players" toggle
- "Apply filters" button and "Clear all" link
- Close button (X) top right
- Active filters show count badge on filter button on main screen

**Edge Cases**:
- If user denies location permission, distance shows as "-- mi" and games sort by time instead of proximity
- If user's location is very rural with no games within 25 miles, shows message "No games in your area yet. Create the first one or adjust your radius."
- If game fills up while user is viewing list, card updates in real-time showing "Full (12/12)" and visual indicator changes
- If user has slow connection, cached games appear immediately with subtle "Last updated 2 hours ago" timestamp
- If it's late night (11pm-6am) and no games are happening, shows message "Quiet hours. Check back in the morning or create tomorrow's game."

### Game Detail Screen

**Purpose**: Show all information about a specific game, allow RSVPing, and provide context about who's playing.

**What Users See**:
- Hero section at top:
  - Sport name and skill level badge ("Intermediate Basketball")
  - Location with full address and "Get directions" link
  - Date and time prominently displayed
  - Map snippet showing exact location (tappable for full-screen map)
- Player section:
  - Current count vs. needed ("8/10 players confirmed")
  - List of RSVP'd players showing avatar, name, skill rating (e.g., "⭐ 4.2"), and optional note if they're the organizer
  - "Waitlist (3)" expandable section if game is full
  - "Maybe (2)" expandable section showing people who marked uncertain
- Action buttons (sticky at bottom):
  - Primary: "I'm going" (green), "Can't go" (if already RSVP'd), or "Join waitlist" (if full)
  - Secondary: "Maybe" (yellow)
  - Chat button: "Message players (12)"
- Game details expandable section:
  - Description/notes from organizer (if any)
  - What to bring (e.g., "Bring water, balls provided")
  - Skill level expectations
  - Cost if any (most games are free)
  - Recurring game indicator if applicable ("This game happens every Wednesday")
- Organizer section:
  - Name, photo, rating
  - "Games organized: 23" stat
  - "Message organizer" button
- Bottom navigation bar: Home, My Games, Messages, Profile

**States**:
- **Loading**: Skeleton showing layout structure with gray placeholders
- **Populated**: All game information displayed
- **Game cancelled**: Red banner at top "This game was cancelled by the organizer" with reason if provided, all action buttons disabled/removed
- **Game started**: Orange banner "This game is in progress" if current time is past start time but within game duration
- **Game finished**: Gray banner "This game has ended" if past end time, shows "How was it?" rating prompt if user attended
- **Game full**: "Full (10/10)" displayed, primary button changes to "Join waitlist"
- **User already RSVP'd**: Button shows "Can't go anymore" instead of "I'm going", player's own avatar highlighted in list
- **Offline**: Data shows with banner "Last updated X minutes ago - offline", action buttons disabled with message "Connect to RSVP"
- **Deleted/not found**: "This game no longer exists" with back button

**Interactions**:
- Tap "I'm going" → Button shows spinner, then success confirmation "You're in!", user's avatar appears in player list, player count updates, button changes to "Can't go anymore"
- Tap "Can't go anymore" → Confirmation dialog "Remove your RSVP? This will open your spot for others" with Cancel/Confirm
- Tap "Maybe" → User added to "Maybe" list, button changes to "Can't go anymore", doesn't count toward player count
- Tap "Join waitlist" → User added to waitlist, gets notification when spot opens
- Tap "Get directions" → Opens native maps app (Google Maps on Android, Apple Maps on iOS) with location pre-loaded
- Tap map snippet → Opens full-screen map view with pin
- Tap "Message players" → Opens game-specific chat screen
- Tap any player avatar → Opens that player's profile
- Tap organizer → Opens organizer profile
- Pull down → Refreshes game data, updates player list in real-time
- Share button (top right) → Opens native share sheet with game details and app link

**Edge Cases**:
- If user isn't logged in, tapping "I'm going" prompts authentication with message "Sign in to RSVP"
- If organizer cancels game while user is viewing, red banner appears immediately with push notification
- If another player joins/leaves, the player list updates in real-time without requiring refresh
- If game conflicts with another game user RSVP'd to, shows warning "You're already committed to another game at this time" but still allows RSVP (doesn't block)
- If game is in past but user tries to RSVP, shows message "This game has already happened. Check upcoming games instead."
- If user has cancelled RSVP 3+ times in past week, shows warning "You've cancelled several games recently. Other players rely on accurate RSVPs." but still allows RSVP
- If location is private venue (someone's home court), shows note "Private location - address shared with confirmed players only" until user RSVPs

### Game Creation Flow

**Purpose**: Allow users to create new pickup games quickly with minimal required fields.

**What Users See**:
- Multi-step form (3 steps, progress indicator at top):
  
**Step 1: Basics**
- Sport type selector (large tappable icons for Basketball, Soccer, Volleyball, Tennis, Ultimate Frisbee, Other with text field)
- Date picker (defaults to next available common time: tonight if before 3pm, tomorrow if after)
- Time picker (start time, duration auto-set to 1.5 hours but adjustable)
- "Next" button

**Step 2: Location & Players**
- Location search field with autocomplete showing nearby parks/courts
- Alternative: "Use my current location" button
- Map view showing selected location pin (draggable to adjust)
- Player count needed selector (4-30, defaults to common counts per sport: 10 for basketball, 14 for soccer, etc.)
- "Next" button

**Step 3: Details**
- Skill level selector: Beginner, Intermediate, Advanced, All levels welcome
- Optional description/notes text field (placeholder: "What should players know?")
- Optional "What to bring" field (placeholder: "Balls, water, etc.")
- Cost field (defaults to "Free", can set amount if court rental split)
- Recurring game toggle: "Repeat this game weekly" with day-of-week selector
- "Create game" primary button
- "Save as draft" secondary text link

**States**:
- **Empty form**: All fields at defaults, validation doesn't trigger yet
- **Validation errors**: Fields with problems highlighted in red with specific error messages below ("Location is required", "Date must be in the future")
- **Submitting**: "Create game" button shows spinner, form fields disabled
- **Success**: Brief success screen "Game created! 🎉" showing game details, then auto-navigates to game detail screen
- **Error**: Error message at top "Couldn't create game. Check your connection and try again."
- **Draft saved**: Confirmation toast "Draft saved" appears, user returns to previous screen, draft accessible from profile

**Interactions**:
- Tap "Next" on step 1 → Validates required fields (sport, date, time), advances to step 2 if valid or shows errors
- Tap "Next" on step 2 → Validates location selected, advances to step 3 if valid
- Tap "Create game" on step 3 → Validates entire form, submits if valid
- Tap back button → Returns to previous step, preserves all entered data
- Close button (X) top right → Shows confirmation "Discard this game?" with "Save draft" and "Discard" options
- Tap "Use my current location" → Sets location to current coordinates, shows on map with detected venue name if available
- Type in location search → Shows autocomplete dropdown with nearby parks, courts, gyms, addresses
- Drag map pin → Updates location to new coordinates, reverse-geocodes to address
- Toggle "Repeat weekly" → Shows additional field "Until when?" with date picker (defaults to 8 weeks out)

**Smart Defaults** (AI-enhanced later, rule-based in MVP):
- If creating basketball game and user previously played at Highland Park, that location appears as first autocomplete suggestion
- If creating game on Saturday morning, defaults to 10:00 AM based on common pickup times
- If user's skill rating is 4.2/5.0, defaults to "Intermediate" skill level
- Player count defaults based on sport: Basketball=10, Soccer=14, Volleyball=12, Tennis=4

**Edge Cases**:
- If user tries to create game at same time/location as existing game, shows warning "There's already a [sport] game here at this time. Create anyway or join that one instead?"
- If user tries to create game less than 2 hours in the future, shows confirmation "Short notice game! Players may not see this in time. Create anyway?"
- If location search finds no results, shows "Can't find that location. Try a nearby park or address."
- If user sets cost above $20, shows warning "High cost may discourage players. Consider marking free and collecting separately."
- If user navigates away mid-creation, auto-saves progress as draft (expires after 7 days)
- If user creates 5+ games in one day, shows gentle warning "You're on a roll! Make sure you can actually organize all these games." (prevents spam)

### My Games Screen

**Purpose**: Show all games the user is involved with: upcoming games they've RSVP'd to, past games they attended, and games they created.

**What Users See**:
- Tab selector at top: "Upcoming" (default), "Past", "Organizing"
- **Upcoming tab**:
  - Chronologically sorted list of games user RSVP'd to
  - Each card shows same info as discovery screen (sport, location, time, player count) plus RSVP status indicator ("Confirmed", "Waitlisted", "Maybe")
  - "Check in" button appears on games starting within next hour
  - Empty state: "No upcoming games. Find one to join!" with browse button
- **Past tab**:
  - Reverse chronological list of completed games
  - Each card shows same info plus "Rate this game" button if not yet rated
  - Shows whether user actually attended (based on check-in) vs. just RSVP'd
  - Empty state: "Your game history will appear here"
- **Organizing tab**:
  - Games user created, sorted by upcoming first then past
  - Each card shows same info plus organizer controls ("Edit", "Cancel", "Message all players")
  - Shows RSVP count prominently since user needs to monitor this
  - Empty state: "You haven't organized any games yet. Create your first one!"
- Pull-to-refresh updates all tabs
- Bottom navigation: Home, My Games (active), Messages, Profile

**States**:
- **Loading**: Skeleton cards for each tab
- **Empty**: Appropriate empty state message per tab with relevant action button
- **Populated**: List of game cards
- **Offline**: Shows cached games with "Offline - showing recent games" banner
- **Error**: "Couldn't load your games. Pull down to retry."

**Interactions**:
- Tap any game card → Opens game detail screen
- Tap "Check in" → Confirmation "Checked in to [game name]", button changes to "Checked in ✓", notifies organizer
- Tap "Rate this game" → Opens rating dialog with 1-5 stars and optional comment
- Swipe left on upcoming game card → Reveals "Cancel RSVP" action
- Tap "Edit" on organized game → Opens edit flow (similar to creation)
- Tap "Cancel game" → Confirmation dialog "Cancel this game? All [X] players will be notified." with reason field (optional), then sends notifications
- Tap "Message all players" → Opens group chat for that game
- Switch between tabs → Preserves scroll position per tab

**Edge Cases**:
- If game user RSVP'd to gets cancelled, it appears in upcoming with "Cancelled" tag and muted colors
- If user no-showed to a game (RSVP'd but didn't check in), past game shows "No-show" indicator which negatively impacts their reliability rating
- If organized game has zero RSVPs 24 hours before start, shows gentle prompt "Need more players? Share this game with friends"
- If user has 5+ conflicting games (same time), shows warning at top "You have overlapping games - review your schedule"

### Game Chat Screen

**Purpose**: Allow players RSVP'd to a game to coordinate details, ask questions, and build rapport before the game.

**What Users See**:
- Chat header showing game name, time, and player count
- Scrollable message thread showing:
  - Player avatar, name, and message text
  - Timestamp (relative: "2m ago", "Yesterday 3:45 PM")
  - System messages for game events ("Jake joined the game", "Maria cancelled", "Game time changed to 6:30 PM")
  - "Organizer" badge on messages from game creator
- Message composition area at bottom:
  - Text input field
  - Send button (disabled when empty)
  - Optional: attach photo button for sharing court conditions
- Participant list accessible via tap on player count in header
- Back button returns to game detail

**States**:
- **Loading**: Empty chat with loading spinner
- **Empty**: "No messages yet. Say hi to your teammates!" with first message prompt
- **Populated**: Scrollable message thread
- **Offline**: Messages shown with banner "Offline - messages will send when connected", new messages queue locally
- **Sending**: User's message appears immediately with sending spinner, then checkmark when confirmed
- **Failed send**: Message shows red indicator, tap to retry
- **Typing indicators**: "Jake is typing..." appears when other users are composing

**Interactions**:
- Tap send → Message appears immediately in thread, scrolls to bottom, input clears
- Tap player avatar in message → Opens that player's profile
- Tap player count in header → Shows list of all RSVP'd players with avatars, tapping any opens profile
- Scroll up → Loads older messages (pagination)
- Pull down → Refreshes message thread
- Long-press message → Shows options: Copy text, Report (if not user's message), Delete (if user's message, within 5 min)
- Tap system message → Highlights related action (e.g., tapping "Jake joined" shows Jake's profile)

**Edge Cases**:
- If user leaves game (cancels RSVP), chat becomes read-only with message "You've left this game. RSVP to chat again."
- If game is cancelled, chat remains readable but composition disabled with message "Game cancelled - chat closed"
- If user is waitlisted (not confirmed), can read chat but gets banner "Join the game to send messages"
- If user is blocked by another player, their messages are hidden from that player
- System messages for repeated events are condensed: "3 players joined: Jake, Maria, David" instead of 3 separate messages
- Chat notifications are grouped per game to prevent spam: "3 new messages in Saturday Basketball" instead of 3 separate notifications

### Player Profile Screen

**Purpose**: Show a player's reputation, stats, and reliability to help others decide if they want to play with them.

**What Users See**:
- Profile header:
  - Large avatar photo
  - Name and optional pronouns
  - Skill rating (large prominent number, e.g., "4.2/5.0")
  - Member since date
  - Edit profile button (if viewing own profile)
- Stats section:
  - Games attended (e.g., "42 games")
  - Reliability percentage (e.g., "95% - shows up when committed")
  - Sports played with breakdown (Basketball: 30, Soccer: 12)
  - Favorite locations (top 3 courts/parks)
- Recent activity feed:
  - Last 10 games attended with date and location
  - Positive feedback received ("Great teammate!", "Good sport")
- Bio section (optional user-written text)
- Block/report button (three-dot menu, only when viewing others)

**States**:
- **Loading**: Skeleton showing profile structure
- **Populated**: All stats and activity displayed
- **Own profile**: Shows "Edit profile" button, displays private stats like no-show count
- **Other player**: Shows public stats only, includes message button
- **Blocked player**: Shows minimal info with "You've blocked this player" message
- **Deleted account**: "This player is no longer active"
- **Offline**: Shows cached profile data with "Offline" banner

**Interactions**:
- Tap "Edit profile" → Opens profile editing screen (change photo, bio, preferred sports)
- Tap "Message" → Opens direct message thread with this player
- Tap any game in activity feed → Opens that game's detail screen
- Tap sport breakdown → Filters activity to show only that sport
- Three-dot menu → Shows Block, Report options
- Tap "Block" → Confirmation "Block [name]? They won't see your games and you won't see theirs." with Block/Cancel

**Reliability Calculation** (transparent to users):
- Percentage = (games attended / games RSVP'd to) × 100
- Attended = user checked in or organizer confirmed attendance
- No-shows counted separately and shown on own profile privately
- New users show "New player - no reliability data yet"

**Edge Cases**:
- If player has < 3 games, shows "Building reputation..." instead of percentage
- If viewing player who blocked you, shows "Profile unavailable"
- If player has 100% reliability with 50+ games, shows special "Reliable Player ⭐" badge
- If player has < 70% reliability, their profile shows this prominently to warn others

### User Profile (Own Profile)

**Purpose**: Allow users to manage their account, preferences, and view their own comprehensive stats.

**What Users See**:
- Profile header (same as player profile but with edit capability)
- Account section:
  - Email address (from OAuth)
  - Login method (Google/Apple)
  - "Log out" button
  - "Delete account" link (small, bottom of section)
- Stats dashboard:
  - Public stats (same as player profile)
  - Private stats visible only to user:
    - No-show count and percentage
    - Games organized vs. attended
    - Most played with (top 5 recurring teammates)
    - Streak (consecutive weeks with at least one game)
- Preferences section:
  - Notification settings button → Opens notification preferences
  - Default sport (auto-selected for quick game creation)
  - Preferred radius for game discovery
  - Skill level per sport (can set different levels for different sports)
- Premium section (if not subscribed):
  - "Upgrade to Premium" card showing benefits
  - $4.99/month pricing
  - 90-day free trial badge for early adopters
- Privacy & Support:
  - Privacy policy link
  - Terms of service link
  - "Contact support" button
  - App version number

**States**:
- **Populated**: All user data displayed
- **Premium subscriber**: Premium section shows "Premium Member ⭐" with benefits and "Manage subscription" button
- **Loading**: Skeleton for stats sections
- **Offline**: Shows cached data with some actions disabled

**Interactions**:
- Tap "Edit profile" → Opens editing screen (change photo via camera/gallery, edit bio, set pronouns, update preferred sports)
- Tap "Notification settings" → Opens detailed notification preferences
- Tap "Upgrade to Premium" → Opens subscription flow with feature comparison
- Tap "Log out" → Confirmation "Log out? You'll need to log in again to RSVP to games." with Log out/Cancel
- Tap "Delete account" → Serious confirmation flow: "Delete your account?" → Explanation of consequences (data deletion, game RSVPs removed) → "Type DELETE to confirm" text field → Final "Delete permanently" button
- Tap "Contact support" → Opens email client with pre-filled email to support@ with device info attached
- Tap skill level for a sport → Opens slider to adjust from 1.0-5.0 with descriptions (1.0="Just learning", 3.0="Play regularly", 5.0="Very experienced")

**Edge Cases**:
- If user tries to log out while RSVPs exist for upcoming games, shows warning "You're committed to [X] upcoming games. Still log out?"
- If user tries to delete account while organizing upcoming games, prevents deletion with error "Cancel your [X] organized games before deleting account"
- If user hasn't set skill level for a sport they've played, prompts after 3rd game: "Help others know your skill level - rate yourself at Basketball"

### Notification Settings

**Purpose**: Give users granular control over what notifications they receive and when.

**What Users See**:
- Category toggles with individual on/off switches:
  - **Game Reminders**: "Get notified before games you're attending" (default: on)
    - Sub-setting: Timing (24 hours before, 2 hours before, 30 minutes before) - multi-select
  - **Chat Messages**: "New messages in game chats" (default: on)
    - Sub-setting: "Only notify for direct @mentions" toggle
  - **Game Updates**: "Changes to games you're in (cancellations, time changes)" (default: on, can't disable - critical notifications)
  - **Waitlist Movements**: "When you move off a waitlist" (default: on)
  - **New Games**: "Games created near you matching your sports" (default: off)
    - Sub-setting: Which sports to notify for (checkboxes)
  - **Social**: "When players message you, rate you, or follow you" (default: on)
- Quiet Hours section:
  - Toggle: "Enable quiet hours" (default: off)
  - Time range selector: From [time] to [time] (default: 10 PM to 8 AM)
  - Note: "Critical updates like cancellations will still come through"
- Test notification button: "Send test notification" to verify settings work
- "Reset to defaults" link at bottom

**States**:
- **Changes saving**: Toggle changes save immediately with brief "Saved" confirmation
- **Offline**: Settings viewable but changes disabled with "Connect to save changes" message

**Interactions**:
- Tap any toggle → Immediately updates preference, shows brief confirmation
- Tap "Send test notification" → Triggers test notification with 2-second delay
- Tap "Reset to defaults" → Confirmation "Reset all notification settings to defaults?" with Reset/Cancel

**Edge Cases**:
- If user disables all notifications, shows warning "You won't receive any updates about your games. Sure?"
- If system notifications are disabled at OS level, shows banner "Notifications disabled in device settings. Enable them to receive updates." with "Open Settings" button
- If quiet hours would block game reminders for an upcoming game, shows inline warning "Your game tomorrow at 7 AM is during quiet hours - you may not get reminded"

## 4. Feature Specifications

### Offline-First Game Discovery

**What It Does**: Users can browse games, view full game details, check RSVP lists, and read chat history even without internet connection. When users open the app in a subway, parking garage, or area with poor connectivity, they see recently-loaded games immediately rather than spinners or error messages. Once connectivity returns, any changes (new RSVPs, chat messages, game updates) sync automatically in the background.

**Why It Matters**: Every competitor analyzed suffers from "network connection errors" and "app fails to load" complaints. TeamSnap users report the app crashes when switching between WiFi and cellular. NBC Sports users complain about constant buffering. Jake (persona) checks the app in his car before leaving work where basement parking has no signal—he needs to see game details to decide whether to drive 20 minutes to the court. Offline capability eliminates the anxiety of "will the app work when I need it?"

**User Perspective**:
- When Jake opens the app in airplane mode, he sees the same 15 games he browsed yesterday, each showing full details: location, time, player lists, chat messages
- A subtle banner at the top says "Offline - showing recent games" so he knows the data might be slightly stale
- He can read game descriptions, view player profiles, and scroll through chat history
- When he tries to RSVP, the button is disabled with message "Connect to RSVP"
- The moment his phone reconnects (exits basement parking), the app silently fetches updates in background
- If a game he was viewing gained 2 new RSVPs while offline, those players appear in the list without him refreshing

**AI Enhancement** (v2.0+):
- Predictive caching learns Jake's patterns: he always checks basketball games near Highland Park between 4-6pm weekdays
- On Wednesday at 3pm when he has connectivity, the app pre-downloads all basketball games within 3 miles of Highland Park happening between 6-9pm today
- When Jake opens the app at 4:30pm in dead zone parking garage, those specific games load instantly because they were predicted and pre-cached
- The AI model runs on-device (TensorFlow Lite, <50KB), using only Jake's own behavioral data, trained on: games_viewed_last_30_days, rsvp_patterns, location_history_at_app_open
- If prediction fails or model is unavailable, falls back to rule-based caching: most recent 100 games viewed, 50 nearest games, user's RSVPs

**Fallback When AI Unavailable**:
- MVP launches with rule-based caching only: last 100 viewed games, 50 nearest to last known location, all user's RSVPs
- This covers 90% of use cases without AI
- Cache refreshes whenever app opens with connectivity, expires after 24 hours
- Users never see different behavior whether AI is active or not—caching just gets smarter over time

**Edge Cases**:
- If user is offline for 3+ days, cached games in the past show "This game has ended" with note that data is stale
- If cached game shows 8/10 players but actually filled while offline, user sees stale data until reconnection, then gets update notification "Saturday Basketball is now full"
- If user creates RSVP while offline, it queues locally and shows "Sending..." spinner that resolves when online
- If user views a game not in cache while offline, shows "Connect to view this game" instead of error
- Cache automatically clears for games more than 7 days in the past to save device storage

### Zero-Friction Authentication

**What It Does**: Users can browse all games and view details without ever creating an account. When they want to RSVP, they tap one button ("Continue with Google" or "Continue with Apple"), approve in the OAuth popup, and return to the app fully authenticated. Sessions persist indefinitely—the app never forces re-login unless the user explicitly logs out or revokes OAuth permissions. Sessions survive app updates, device restarts, and network changes.

**Why It Matters**: NBC Sports users report "asks me to log in every single day" and "unauthorized error constantly." FanDuel users complain about "endless re-linking of cable provider" and "zip code verification loops." Authentication is the #2 complaint across analyzed competitors. David (persona) wants to try the app before committing to account creation. Maria doesn't want to waste time re-authenticating every week. Authentication friction is a primary abandonment point.

**User Perspective**:
- David opens app for first time, immediately sees games near him without any login wall
- He browses for 2 minutes, finds an interesting game, taps "I'm going"
- Single prompt appears: "Sign in to RSVP" with "Continue with Google" and "Continue with Apple" buttons, plus small "Why sign in?" link
- He taps Google, approves in popup (2 seconds), returns to app
- His RSVP is immediately confirmed, no additional profile creation steps
- Three months later, he opens the app after not using it for weeks—still logged in, no re-authentication
- After app update from v1.2 to v1.3, he opens app—still logged in, sessions persisted
- Only if he explicitly taps "Log out" in profile settings does his session end

**Technical Requirements** (what must happen, not how):
- OAuth2 integration with Google and Apple identity providers
- Initial access tokens exchanged for long-lived refresh tokens
- Before access token expires, app silently exchanges refresh token for new access token in background
- Token refresh happens transparently—user never sees any authentication UI unless initial login or explicit logout
- If refresh token expires (user revoked permissions, 90+ days of app inactivity), user sees gentle "Please sign in again" with same one-tap flow
- Sessions persist across app updates via secure storage that survives app data updates
- No email/password option (avoids password reset flows and security headaches)
- No forced profile completion steps after OAuth

**AI Enhancement** (v2.0+):
- Session health monitoring predicts when token expiration might fail (e.g., user has been offline for days and refresh window is narrowing)
- If AI detects risky session state, preemptively prompts: "Your session might expire soon. Open the app while online to stay logged in." (only shown if user hasn't opened app in 60+ days)
- Natural language support chat can diagnose auth problems: "I can't log in" → "I see you're trying to use Google sign-in. Have you allowed PickupPro access in your Google account settings?"
- AI learns from error patterns: if many users with same device/OS combo have auth failures, flags for engineering investigation

**Fallback When AI Unavailable**:
- Standard OAuth2 token refresh with conservative expiration handling (refresh 24 hours before expiration instead of waiting until last minute)
- Clear error messages if auth fails: "Session expired. Sign in again to continue." with one-tap re-auth
- Users never see the AI working—they just see reliable authentication

**Edge Cases**:
- If user denies OAuth permissions in popup, shows message "We need permission to create your account. Try again?" with retry button
- If OAuth provider is down (Google/Apple service outage), shows message "Sign-in temporarily unavailable. Try again in a few minutes."
- If user creates account on iPhone with Apple, then downloads Android app, can sign in with Google using same email and accounts link automatically
- If user revokes OAuth permission in their Google account settings, next app open shows re-auth prompt instead of crashing
- If user tries to RSVP while unauthenticated and network is down, shows "Connect to internet to sign in and RSVP"

### Ad-Free Core Experience

**What It Does**: Game discovery, RSVP, basic chat, and skill ratings contain zero advertisements. Users never see banner ads, interstitials, video ads, or sponsored content while browsing games or coordinating with players. Advanced features (detailed statistics, private leagues, custom branding for recurring games) are gated behind a $4.99/month premium subscription, but all functionality needed to find games and show up to play remains free forever.

**Why It Matters**: TeamSnap users complain "ads make this app more annoying than useful." FOX Sports users report "ads you can't close during live games." NBC Sports users say "more ads than content." Excessive advertising is the #1 complaint across analyzed competitors. Jake will pay for value but refuses to be interrupted by ads. Maria tried a competitor's free tier and found ads appearing between every screen transition, making the app unusable.

**User Perspective**:
- Jake uses the app daily for 3 months without seeing a single advertisement
- He browses games, RSVPs, chats with players, checks profiles—completely ad-free
- One day he notices a small card in his profile: "Upgrade to Premium: Get advanced stats and support PickupPro - $4.99/month"
- The card is dismissible and reappears once per week, but never interrupts his workflow
- Maria organizes 20+ games over 2 months on free tier, never blocked by paywall or ads
- After organizing her 10th game, she sees a gentle prompt: "Try Premium free for 90 days" with benefits listed
- She can dismiss this and continue free forever, or try premium
- There's no artificial limitation on free features—she can organize unlimited games, message unlimited players

**Premium Tier Benefits** (what justifies $4.99/month):
- Advanced personal statistics: attendance streaks, favorite teammates, peak performance times, charts showing activity over time
- Private leagues: create invitation-only recurring games with custom branding (logo, colors) for regular groups
- Priority support: guaranteed response within 24 hours vs. 72 hours for free
- Early access to new features 2 weeks before general release
- Custom game notifications: set specific notification preferences per game vs. global settings
- Game history export: download all your game data as CSV

**AI Enhancement** (v2.0+):
- Conversion predictor identifies optimal moments to show premium trial offer based on engagement signals:
  - User has attended 5+ games (proven engagement)
  - User has organized 3+ games (indicates organizer role)
  - User has sent 20+ chat messages (socially invested)
  - User has opened app 15+ times in past month (habitual user)
- Model outputs probability score 0-1 for "will convert within 7 days if offered trial"
- Only users scoring >0.6 see premium trial offer, and only once per 30 days
- This prevents annoying low-intent users while maximizing conversion from high-intent users
- Model is XGBoost trained on conversion events, features are engagement metrics
- Target: 8-12% conversion rate (3x industry standard freemium conversion)

**Fallback When AI Unavailable**:
- Rule-based premium prompts:
  - After user organizes 3rd game: "Try Premium features free for 90 days"
  - After user attends 10th game: "Unlock advanced stats with Premium"
  - Once per week on profile screen: dismissible premium card
- No spam, no interruptive prompts during critical flows (never during RSVP, never in game chat)
- Conversion rate likely 3-4% without AI, still viable business model

**What This Prevents** (anti-patterns from competitors):
- TeamSnap shows banner ads between every screen navigation → PickupPro shows zero ads anywhere
- FOX Sports shows video ads during live content → PickupPro has no video ads ever
- NBC Sports forces users to link cable provider for basic features → PickupPro requires no provider linking
- NFL Fantasy hides basic features behind paywall → PickupPro keeps all core features free
- Apps that show "Upgrade to remove ads" → PickupPro never has ads to remove, premium offers value-add features instead

**Edge Cases**:
- If user subscribes to premium then cancels, they retain premium features until end of billing period, then gracefully downgrade
- If user has premium trial (90 days free), they get reminder 7 days before trial ends: "Your trial ends soon. Subscribe for $4.99/month to keep advanced stats."
- If payment fails for premium subscriber, premium features continue working for 7 days grace period with gentle reminder to update payment
- If app is running low on revenue, the solution is improving premium value proposition, never adding ads to free tier

### Transparent Skill Ratings

**What It Does**: Every player has a public skill rating (1.0-5.0 scale) visible on their profile, game RSVPs, and chat messages. Ratings are calculated using a transparent, documented algorithm based purely on: (1) number of games attended, (2) peer feedback after games (thumbs up/down from other attendees), and (3) self-reported skill level during onboarding, with (2) weighted most heavily. The methodology is explained in plain language in-app, there are no hidden factors, and users can see exactly how their rating is calculated. Ratings cannot be purchased, boosted by in-app purchases, or manipulated by paying users.

**Why It Matters**: BIG WIN Basketball users complain about "unfair matchmaking" and "pay-to-win mechanics" where players who spend money get matched against beginners for easy wins. Competitor apps use opaque algorithms that frustrate users. Jake wants to find games at his level (intermediate) but has no way to assess if a game will be competitive or if he'll be the worst player. David is intimidated by showing up to advanced games. Transparent ratings solve the "skill mismatch" problem and build trust.

**User Perspective**:
- David creates account and sets his basketball skill as "Beginner" during onboarding
- His initial rating shows as "2.0/5.0 - Self-rated, play more games for accurate rating"
- He attends his first game, plays reasonably well for a beginner
- After the game, he gets prompt: "Rate the players you played with" showing 6 other players with thumbs up/down buttons
- He gives 5 thumbs up, 1 thumbs down to someone who was overly aggressive
- Other players rate him: 4 thumbs up, 2 thumbs down (he missed some easy shots but had good attitude)
- His rating updates to "2.3/5.0 - Based on 1 game, 4 positive ratings"
- After 10 games, his rating stabilizes at "3.1/5.0 - Based on 10 games, 67% positive ratings"
- He taps his rating → sees explanation:
  - "Your skill rating is calculated from peer feedback after games you attend."
  - "67% of players gave you positive ratings (26 up, 13 down)"
  - "Ratings typically range 2.0-4.0 for recreational players"
  - "This helps match you with appropriate games"
- Jake, with rating 4.2/5.0 from 42 games, can filter game discovery to "Intermediate (3.0-4.5)" to find competitive matches
- Maria can see that a new player requesting to join her regular game has rating 1.5/5.0 from only self-assessment, and decides to message them: "This is an intermediate game - you might find the beginner games at Lincoln Park more fun!"

**Rating Calculation** (transparent to users):
- New users start with self-assessment: Beginner=2.0, Intermediate=3.5, Advanced=4.5
- After each game, attendees can rate each other (thumbs up=+1, thumbs down=-1, no rating=0)
- Positive rating percentage = (thumbs up) / (thumbs up + thumbs down) × 100%
- After 3+ games: Rating = (self_assessment × 0.2) + (peer_feedback_average × 0.8)
- After 10+ games: Rating = peer_feedback_average only (self-assessment no longer factors)
- Peer_feedback_average = 1.0 + (positive_percentage × 4.0), scaled so 0%=1.0, 50%=3.0, 100%=5.0
- Example: David gets 26 up, 13 down = 67% positive = rating of 1.0 + (0.67 × 4.0) = 3.68, rounds to 3.7/5.0
- Ratings update within 5 minutes of game ending and all attendees submitting feedback
- Users can view their detailed breakdown: "Games attended: 15, Ratings received: 54 up / 18 down (75%), Current rating: 4.0/5.0"

**Why This Is Different from Competitors**:
- No hidden "matchmaking rating" that users can't see
- No algorithmic manipulation based on spending
- No "skill-based matchmaking" that pairs players to encourage purchases (BIG WIN Basketball problem)
- Complete transparency: formula is documented in help section, users see exact calculation
- Peer-driven instead of app-driven: players decide each other's ratings, not an algorithm

**AI Enhancement** (v2.0+):
- Skill-appropriate game recommendations: "Games near you matching your 3.7/5.0 skill level"
- AI learns which rating ranges actually produce good games: discovers that 3.0-4.0 range creates best competitive balance
- Outlier detection: if game has 8 players rated 3.5-4.0 and one player rated 1.5, suggests to organizer "This game might be too advanced for [player]"
- Natural language explanations: instead of just showing "3.7/5.0", shows "You're an intermediate player - most recreational athletes are 2.5-4.0"

**Fallback When AI Unavailable**:
- Ratings still calculate using transparent formula
- No personalized recommendations, but users can manually filter by rating range
- Static help text explains rating ranges: "1.0-2.5: Learning, 2.5-4.0: Recreational, 4.0-5.0: Advanced"

**Edge Cases**:
- If player receives no ratings after a game (other players didn't submit feedback), their rating doesn't change, shows "No new ratings from your last game"
- If player receives all negative ratings in first 3 games, rating drops to minimum 1.0, but shows encouragement: "Keep playing! Ratings improve with practice."
- If two players collude to boost ratings (always give each other thumbs up), pattern detection flags after 10+ games together, shows warning to other users "These players frequently play together and rate each other highly"
- If player hasn't played in 6+ months, rating shows as "Rusty - 3.7/5.0 (last played 8 months ago)" to warn others their skill may have declined
- If player creates multiple accounts to manipulate ratings, requires phone number verification after account shows suspicious patterns
- If player complains "my rating is too low," support can point to exact calculation and peer feedback—no subjective debate

### Smart Notification System

**What It Does**: Users control exactly which notifications they receive through granular category toggles. Each category (game reminders, chat messages, cancellations, waitlist updates, new games nearby) has its own on/off switch and timing preferences. Users can set "quiet hours" (e.g., 10pm-8am) when non-critical notifications are suppressed. Notifications are reliable—they arrive exactly when expected, never duplicate, and never cause phantom vibrations. Critical notifications (game cancellations, time changes for confirmed games) always come through even during quiet hours.

**Why It Matters**: theScore users report "phantom notifications constantly" and "notification spam." Action Network users complain about "notifications for things I don't care about" and "can't customize what I get." Notification problems are pervasive across competitors. Jake wants reminders for his games but not for every message in group chat. Maria wants cancellation alerts immediately but doesn't want spam about every new game created. Poor notification UX drives users to disable all notifications, then they miss critical updates.

**User Perspective**:
- Maria enables these notification preferences:
  - ✅ Game Reminders: 2 hours before, 30 minutes before
  - ✅ Game Updates: All (cancellations, time changes) - cannot disable
  - ✅ Chat Messages: Only for @mentions
  - ❌ New Games: Off (too spammy)
  - ✅ Waitlist Movements: On
  - Quiet Hours: 10 PM - 7 AM
- Tuesday 6pm: Gets notification "Reminder: Soccer game tomorrow at 10 AM" (24 hours disabled per her preference)
- Wednesday 8am: Gets notification "Reminder: Soccer game in 2 hours"
- Wednesday 9:30am: Gets notification "Reminder: Soccer game in 30 minutes"
- Wednesday 9:35am: Someone messages in game chat "Running 5 min late" - Maria gets no notification (not mentioned)
- Wednesday 9:40am: Someone messages "@Maria should we bring both balls?" - Maria gets notification "Sarah mentioned you in Soccer game chat"
- Wednesday 11pm: Someone messages the group chat with logistics for next week - Maria gets no notification (quiet hours)
- Thursday 8am: Maria opens app, sees (1) badge on Messages tab from last night's message
- Friday 8pm: Game organizer cancels Saturday's game - Maria gets immediate notification "Saturday Soccer has been cancelled" despite being within quiet hours (critical update)

**Notification Categories** (what each does):

**Game Reminders**:
- Purpose: Remind users of games they RSVP'd to
- Default: On (24h before, 2h before)
- Options: User selects which intervals: 7 days, 24 hours, 2 hours, 30 minutes, 10 minutes (multi-select)
- Behavior: Each selected interval triggers one notification
- Quiet hours: Suppressed (user can check app if they want reminder)

**Game Updates**:
- Purpose: Alert about changes to confirmed games (cancellations, time changes, location changes)
- Default: On, cannot be disabled (critical notifications)
- Options: None - always enabled
- Behavior: Immediate notification when change occurs
- Quiet hours: Always delivered (critical)

**Chat Messages**:
- Purpose: New messages in game chats
- Default: On (all messages)
- Options: All messages, Only @mentions, Off
- Behavior: Notifications grouped by game to prevent spam - "3 new messages in Saturday Basketball" rather than 3 separate notifications
- Quiet hours: Suppressed

**Waitlist Movements**:
- Purpose: Alert when user moves from waitlist to confirmed
- Default: On
- Options: On/Off toggle
- Behavior: Immediate notification when spot opens
- Quiet hours: Delivered (time-sensitive - user needs to confirm they can attend)

**New Games**:
- Purpose: Notify about newly created games matching user's sports/location preferences
- Default: Off
- Options: On/Off, select which sports to get notified about
- Behavior: Maximum once per day digest at 6pm local time listing new games - never immediate notifications to prevent spam
- Quiet hours: Suppressed

**Social**:
- Purpose: Direct messages, profile ratings, follows
- Default: On
- Options: On/Off toggle
- Behavior: Immediate for direct messages, batched daily for ratings/follows
- Quiet hours: Suppressed except direct messages

**AI Enhancement** (v2.0+):
- Learn user's implicit preferences from notification interaction:
  - If user consistently dismisses game reminders for morning games without opening app, stop sending morning game reminders
  - If user always opens chat notifications within 5 minutes, prioritize those as high-importance
  - If user never opens "new games" notifications, suggest turning them off: "You haven't opened any new game alerts. Want to disable these?"
- Intelligent grouping: "3 updates to your weekend games: Saturday Basketball confirmed (10 players), Sunday Soccer cancelled, Monday Volleyball needs 2 more"
- Predictive quiet hours: if user always dismisses notifications between 10pm-7am for 2 weeks, suggests enabling automatic quiet hours

**Fallback When AI Unavailable**:
- All category toggles and quiet hours work via simple rule-based logic
- No intelligent grouping or learning, but notifications still reliable and customizable
- Users manually configure preferences instead of AI suggesting optimizations

**What This Prevents** (anti-patterns):
- theScore's phantom notifications → PickupPro notifications tied to actual events, never spurious
- Action Network's irrelevant spam → PickupPro gives granular control, defaults conservative (most categories off)
- Apps that bundle all notifications together → PickupPro separates by category with independent controls
- Apps with "all or nothing" notification settings → PickupPro allows nuanced configuration

**Edge Cases**:
- If user has notifications disabled at OS level (iOS Settings → PickupPro → Notifications: Off), shows persistent banner in app "Notifications disabled - you'll miss important game updates" with "Open Settings" button
- If notification fails to deliver (iOS/Android service down), app shows in-app alert when opened: "You may have missed notifications. Check your games."
- If game gets cancelled 15 minutes before start during user's quiet hours, notification delivers immediately (critical timing)
- If user is in multiple games at same time and all send reminders, notifications batch: "Reminder: You have 2 games today at 6 PM" with expanded view showing both
- If user RSVPs to game 10 minutes before start, no reminder notifications sent (too late to be useful)
- If user receives 10+ notifications in 1 hour (unusual), app self-throttles and shows "9+ game updates - open app to see all" to prevent notification fatigue

## 5. What Must Be Different (Anti-Competitor Directive)

### Reliability & Stability Problems

**Competitor Problem**: TeamSnap crashes every time users try to open it, theScore crashes after every update, NBC Sports constantly freezes, Action Network's live scores stop updating. Users report "unusable after update," "crashes non-stop," and "can't even open the app."

**PickupPro Correct Behavior**:
- App must load within 2 

Visual Strategy

Visual strategic analysis with charts and data.

Go / No-Go Scorecard
GO

Weighted Score: 7.0/10

PickupPro addresses a validated market with 50M+ competitor installs but catastrophic satisfaction (2.3-3.7 avg ratings), indicating demand exists despite broken products. Differentiation through offline-first architecture and ad-free core is defensible, and 82/100 feasibility score confirms realistic solo execution path.

Dimension	Score	Weight	Reasoning
Market Need & Pain Severity	8/10	20%	Scout dissatisfaction score of 43/100 indicates moderate pain (not critical), but qualitative review analysis shows acute frustrations with reliability, ads, and auth. Competitor ratings of 2.3-3.7 despite 50M+ installs proves users tolerate terrible products, suggesting strong need. 78K ratings for 2.3-star NFL Fantasy app indicates passionate user base.
Competitive Differentiation	7/10	15%	Offline-first PWA architecture is genuinely novel in sports coordination space. Zero competitors offer ad-free core experience or transparent skill ratings. However, differentiation is execution-based (reliability, UX) rather than proprietary tech, which is replicable by well-funded competitors. Network effects provide moat once established in a city.
Technical Feasibility	9/10	15%	Scout feasibility score of 82/100 confirms realistic solo build. Tech stack (React Native, Supabase, Railway) uses battle-tested tools. Offline-first adds complexity but achievable with Service Workers and conflict resolution. No novel AI/ML required for MVP. Biggest technical risk is real-time sync conflicts, mitigated by last-write-wins strategy.
Go-to-Market Viability	6/10	15%	Hyper-local launch strategy (own Austin before expanding) is sound but requires manual seeding and slow growth. Network effects cold start is highest market risk. Reddit/facility partnerships provide low-cost acquisition ($2.80-$8.50 CPA achievable), but reaching 500 WAU in city 1 may take 4-6 months. Freemium conversion at 8% is optimistic but grounded in SaaS benchmarks.
Revenue Model Sustainability	7/10	15%	Freemium model with $4.99/month premium at 8% conversion yields $0.28 ARPU, supporting 89% gross margin. LTV:CAC of 16.14 is strong. However, breakeven at month 18 requires sustained growth to 12K users, and unit economics depend on maintaining low infrastructure costs (<$200/month). Premium feature value prop (advanced stats) is unproven.
Founder-Market Fit	5/10	5%	No explicit founder background provided. Concept demonstrates deep understanding of competitor failures and user pain points (likely from personal experience or thorough research). 12-week solo dev timeline and technical architecture choices suggest engineering competency. Weakness: no indication of sports community connections or local organizing experience for GTM execution.
Scalability & Expansion Path	6/10	8%	City-by-city expansion model is capital-efficient but slow. After proving unit economics in Austin, playbook is replicable to 50+ mid-large US cities. However, each new city restarts network effects cold start. International expansion unlikely due to localized competition. Premium tier and team organizer tier ($9.99/month) provide revenue scaling beyond user growth.
Risk-Adjusted Upside	7/10	7%	Best case: Achieve 125K users by year 3 with $420K annual revenue and $282K profit, providing lifestyle business income or acquisition target ($2-5M exit to Meetup, TeamSnap). Worst case: Fail to reach critical mass in city 1, shut down after 12 months with $35K sunk costs. Risk-reward is favorable for bootstrapped side project, but unlikely to become venture-scale business.
Key Risks

-
Network effects cold start requiring 500+ users per city before value proposition activates, leading to 4-6 month slow-growth period per market with high user acquisition costs during initial seeding phase
-
Freemium conversion rate of 8% depends on unproven premium feature value (advanced stats, private leagues) and may underperform if core free features are too good, requiring mid-flight monetization pivots
-
Competitive response from TeamSnap or Meetup launching pickup sports features after seeing traction, leveraging existing user bases and brand recognition to crush nascent network before defensibility established
-
Solo founder operational bottleneck with 12-week aggressive timeline creating burnout risk and no backup capacity if developer gets sick or scope creeps, potentially missing critical summer sports season launch window
Key Opportunities

+
Catastrophically low competitor ratings (2.3-3.7 avg) despite 50M+ installs proves users desperately want solution and will switch if alternative delivers basic reliability, creating low bar for competitive displacement
+
Hyper-local launch strategy allows owning Austin market completely (800+ WAU) before competitors notice, building defensible network effects moat and proving unit economics before expansion capital required
+
Offline-first architecture and ad-free positioning create genuine technical and business model differentiation that is difficult for ad-dependent competitors (FOX Sports, NBC Sports) to replicate without cannibalizing revenue
+
Strong unit economics (LTV:CAC 16.14, 89% margin) enable bootstrapped growth without VC pressure, allowing patient city-by-city expansion and maintaining product quality focus over growth-at-all-costs
Recommendation

Proceed with conditional GO, but derisk network effects cold start before committing to full 12-week build. Execute 2-week validation sprint: manually organize 10 pickup basketball games in Austin using Google Forms + WhatsApp, recruit 50 participants, and measure repeat attendance rate. If 30%+ players attend 2+ games in 2 weeks, proceed with MVP build. If below 20%, pivot to B2B model selling coordination software to parks & rec departments instead of consumer app. During MVP build, prioritize offline-first architecture and authentication stability (critical differentiators) over feature breadth. Defer AI predictive caching and advanced stats to v2.0 to ship faster. Launch in single city (Austin) with manual game seeding: recruit 20 organizers, offer $50 credits per game created, partner with 5 facilities for official postings. Require 500 WAU and 60%+ WAU/MAU ratio before expanding to city 2. Accept 18-month breakeven timeline as reasonable for bootstrapped lifestyle business, but set 6-month checkpoint: if below 200 WAU in Austin after 6 months live, shut down and cut losses at $15K sunk costs rather than continuing to burn time on unvalidated market.

User Personas
🏀
Jake, the Consistent Competitor
Plays 2-3x weekly, tired of WhatsApp coordination chaos

29, software engineer, Austin TX, $95K salary, plays basketball/soccer after work

Frustrations

Manages WhatsApp group of 40+ players where half don't respond and games fall apart last-minute
Tried TeamSnap premium ($9.99/month) but it crashed constantly during tournaments
Gets matched with players way above his skill level because no app tracks ability accurately
Goals

Find reliable games with committed players at his intermediate skill level
Stop wasting 30+ minutes per week coordinating via group chat
Track his improvement over time with transparent stats
Willingness to pay: $5-8/month if reliability is proven, cancelled TeamSnap after crashes

⚽
Maria, the Social Organizer
Exhausted by organizing 2 sports leagues via scattered tools

26, marketing manager, Denver CO, $72K salary, organizes soccer and volleyball games

Frustrations

Friends rely on her to organize but she's burned out coordinating via iMessage, Venmo, and Google Sheets
Every app she tries has excessive ads that interrupt critical coordination moments
Payment collection is a nightmare with no integrated solution
Goals

Centralize all game coordination in one reliable app without ads
Get players to commit reliably so she's not scrambling for headcount 2 hours before game time
Automate payment collection for league dues and court rentals
Willingness to pay: $4-6/month for organizing tools, would pay $10/month if it included payment features

🏃
David, the Fitness Newcomer
New to city, intimidated by skill gaps in pickup games

34, accountant, Chicago IL, $68K salary, recently divorced and relocated, wants to meet people through sports

Frustrations

Existing apps have no way to filter for beginner-friendly games, gets destroyed by advanced players
Forced to create accounts and link cable providers just to browse games (NBC Sports, FOX Sports pattern)
Pay-to-win mechanics in sports apps make him feel like skill doesn't matter
Goals

Find beginner-friendly games where he won't embarrass himself
Browse games anonymously before committing to avoid social pressure
Meet consistent group of people at his skill level to build friendships
Willingness to pay: $3-5/month maximum, very price-sensitive until he builds the habit

Market Gap Analysis
No app provides reliable offline game browsing for users in areas with spotty connectivity
Unserved Need
Current Alternatives

Users screenshot game details or copy info to Notes app before losing signal, creating friction and errors

Opportunity Size

35M users in medium-density cities where connectivity is inconsistent but not absent

medium difficulty
Our Approach

Progressive Web App with Service Workers caching last 100 viewed games and 50 nearby games, syncing changes when connection returns

Casual pickup athletes have no purpose-built coordination tool, forced to use youth league apps or group chats
Underserved Segment
Current Alternatives

WhatsApp/iMessage group chats (no skill matching, unreliable RSVPs) or TeamSnap (built for youth leagues, crashes constantly)

Opportunity Size

60M adults playing pickup sports 1-3x/week across 500+ US cities with 50K+ population

high difficulty
Our Approach

Hyper-focused on pickup game use case with skill ratings, transparent RSVP tracking, and conflict detection across multiple sports

Every competitor forces account creation and/or shows ads during critical coordination moments
Blue Ocean
Current Alternatives

No alternative exists—users tolerate authentication friction and ad interruptions because no competitor offers ad-free anonymous browsing

Opportunity Size

95% of analyzed competitors have IAP and ads, representing untapped market of users willing to pay for clean experience

low difficulty
Our Approach

Optional anonymous browsing with one-tap OAuth2 social login, zero ads in core features, sustainable freemium model at $4.99/month premium

Skill-based matchmaking doesn't exist transparently—users get destroyed by advanced players or bored playing below their level
Feature Gap
Current Alternatives

BIG WIN Basketball has matchmaking but users report pay-to-win mechanics and unfair matching (61 overall teams losing to 40 overall teams)

Opportunity Size

78% of users in skill-mismatch complaints across 156K+ BIG WIN Basketball ratings want fair, transparent matching

medium difficulty
Our Approach

Public ELO-style rating based purely on attendance and peer feedback (+1/-1 votes), no hidden algorithms or pay-to-boost, visible methodology

No app successfully maintains stability across updates—every competitor has post-update crash problems
Feature Gap
Current Alternatives

theScore's widget breaks after updates, TeamSnap crashes during tournaments, NBC Sports gives 'unauthorized' errors randomly

Opportunity Size

68% of analyzed apps have critical stability complaints in recent reviews, affecting 50M+ combined installs

low difficulty
Our Approach

Automated crash reporting with pre-release testing on 50+ device/OS combinations, performance budgets enforcing <2s load times, widget visual regression testing

Payment collection for leagues and court rentals scattered across Venmo, PayPal, manual tracking
Unserved Need
Current Alternatives

Organizers manually track payments in spreadsheets, chase non-payers via direct messages, lose money to no-shows

Opportunity Size

15M league organizers managing 3-5 games/week with average $10-25/player collection needs

medium difficulty
Our Approach

Stripe integration in Team Plan ($14.99/month) allowing automated payment collection, refunds for cancellations, transparent ledger for organizers

Revenue Model
Strategy: Freemium with 90-day premium trial for early adopters. Core features (game discovery, RSVP, basic chat, skill ratings) free forever with zero ads. Premium tier ($4.99/month) adds advanced stats, private leagues, priority support. Monetization designed to avoid competitor mistakes: no forced paywalls, no billing disasters, no ads interrupting core experience. | Projected ARPU: Month 1-3: $0.15 (3% conversion during 90-day trials), Month 4-6: $0.42 (8% conversion as trials convert), Month 7-12: $0.58 (10% premium + 2% team plans stabilizing)

Free
$0

+
Unlimited game discovery and RSVP
+
Basic skill ratings and attendance tracking
+
Group chat for game coordination
+
Offline-first browsing with cached games
Popular
Premium
$4.99/month

+
Advanced statistics dashboard (streaks, favorite courts, peak times)
+
Private league creation with custom rules
+
Priority customer support (24hr response)
+
Early access to new features
+
Ad-free forever (core features already ad-free)
Team Plan
$14.99/month

+
Everything in Premium
+
Manage up to 5 private leagues simultaneously
+
Payment collection integration (Stripe)
+
Custom branding for league pages
+
Admin analytics for league organizers
12-Month Projections
M1
M3
M5
M7
M9
M12
0
7k
14k
21k
28k
$0
$5k
$9k
$14k
$18k
Revenue Projections & Unit Economics
CAC

$4.20

LTV

$67.80

LTV:CAC

16.14x

Monthly Churn

4.2%

Gross Margin

89%

Break Even

Month 18

Metric	Value	Notes
Average Revenue Per User (ARPU)	$0.28/month	8% freemium conversion at $4.99/month premium tier plus 2% take $9.99/month team organizer tier. Weighted average across free and paid users.
Monthly Active User to Paid Conversion	8.0%	Target conversion rate based on 90-day premium trial converting at 12% and organic conversions at 5%. Blended rate stabilizes at 8% by month 9.
Average Customer Lifetime	20 months	Monthly churn of 4.2% implies 1/0.042 = 23.8 months average lifetime. Conservative estimate uses 20 months accounting for seasonal sports patterns.
Customer Acquisition Cost (CAC) Payback Period	15 months	CAC of $4.20 paid back through $0.28 ARPU = 15 months. Includes blended costs: Reddit ($2.80 CPA), Instagram ($8.50 CPA), referrals ($1.20 CPA).
Contribution Margin Per User	$5.58/month	Premium user pays $4.99, costs $0.55 infrastructure (Supabase $0.15, Railway $0.20, Mapbox $0.10, push notifications $0.10). 89% margin.
Network Effect Multiplier	1.8x after 500 users	Each new user in a city creates 1.8x value through denser game options. Measured by games_available_per_user metric growing non-linearly with user base.
Year	Users	Revenue	Costs	Profit
Year 1	12K	$42K	$29K	$13K
Year 2	48K	$162K	$64K	$98K
Year 3	125K	$420K	$138K	$282K
Competitive Matrix
Competitor	AI Features	UX/Design	Pricing	Performance
PickupProOurs	7	9	9	9
TeamSnap	2	5	4	4
theScore	3	7	8	6
NBC Sports	1	4	7	3
Competitive Deep Dive

PickupPro
Ours
Free core features forever, $4.99/month premium tier, $14.99/month team plans
Expand

TeamSnap
Free with IAP, premium $9.99/month
Expand

theScore
Free with no IAP, ad-supported
Expand

NBC Sports
Free, requires cable subscription for full access
Expand
Data Model
User
Represents a player who can discover games, RSVP, and attend pickup sports events. Supports both authenticated and anonymous browsing modes.

Attributes

user_id (UUID primary key)
oauth_provider (google/apple/anonymous)
email (nullable for anonymous)
display_name
skill_ratings (JSONB: {basketball: 1450, soccer: 1200})
location_preference (geography point)
created_at
last_active_at
Relationships

N:N
Game
— Users can RSVP to multiple games, and each game has multiple attendees. Junction table: rsvps with status (confirmed/waitlist/cancelled).
1:N
RSVP
— Each user has multiple RSVPs across different games, tracking their attendance history and commitment patterns.
1:N
SkillRating
— Users accumulate skill ratings per sport through peer feedback, with historical rating changes tracked for transparency.
Game
A scheduled pickup sports event at a specific location and time. Can be one-time or recurring weekly. Includes skill level expectations and capacity limits.

Attributes

game_id (UUID primary key)
sport_type (basketball/soccer/tennis/volleyball)
venue_location (geography point with PostGIS)
venue_name
scheduled_time
skill_level (beginner/intermediate/advanced/open)
max_players
min_players
recurrence_rule (iCal RRULE format, nullable)
organizer_user_id (foreign key)
status (upcoming/full/cancelled/completed)
created_at
Relationships

N:N
User
— Games have multiple attendees (users who RSVPed), tracked through rsvps junction table with attendance confirmation.
1:N
RSVP
— Each game has multiple RSVPs from different users, with statuses indicating confirmed, waitlist, or cancelled.
N:N
Venue
— Games occur at venues, with many games at the same venue over time. Enables venue-based game discovery and history.
RSVP
Junction entity tracking user commitments to attend games. Includes RSVP timestamp, attendance confirmation, and post-game peer feedback.

Attributes

rsvp_id (UUID primary key)
user_id (foreign key)
game_id (foreign key)
status (confirmed/waitlist/cancelled/no_show)
rsvp_timestamp
attended (boolean, confirmed post-game)
peer_feedback_given (boolean)
created_at
updated_at
Relationships

N:N
User
— RSVPs link users to games they plan to attend, forming the core coordination mechanism.
N:N
Game
— RSVPs connect games to their attendees, enabling organizers to track commitments and manage capacity.
1:1
PeerFeedback
— Each RSVP can have one peer feedback entry submitted post-game, contributing to skill rating calculations.
Venue
Physical location where games occur (parks, courts, gyms). Includes amenities, photos, and aggregate ratings from past games.

Attributes

venue_id (UUID primary key)
name
address
location (geography point)
sport_types_available (array: basketball, soccer, tennis)
amenities (JSONB: {lighting: true, parking: true, bathrooms: false})
photo_urls (array of strings)
aggregate_rating (decimal, from game feedback)
created_at
Relationships

1:N
Game
— Each venue hosts multiple games over time. Venue history shows past game quality and attendance patterns.
1:N
VenueReview
— Users can submit venue reviews independent of games, rating facilities, cleanliness, and accessibility.
SkillRating
Tracks user skill level per sport using ELO-style algorithm based on attendance consistency and peer feedback. Transparent calculation with historical changes.

Attributes

rating_id (UUID primary key)
user_id (foreign key)
sport_type (basketball/soccer/tennis/volleyball)
current_rating (integer, 1000-2000 scale)
rating_history (JSONB array of {timestamp, rating, reason})
games_played_count
last_updated
confidence_level (low/medium/high based on games_played)
Relationships

N:N
User
— Users have one skill rating per sport type, allowing multi-sport players to maintain separate ratings.
1:N
PeerFeedback
— Skill ratings are updated based on peer feedback from games, with each feedback entry contributing to rating adjustments.
PeerFeedback
Post-game feedback from attendees rating each other's skill and sportsmanship. Simple +1/0/-1 system prevents gaming. Anonymous but verified.

Attributes

feedback_id (UUID primary key)
rsvp_id (foreign key to attendance record)
feedback_giver_user_id (foreign key)
feedback_recipient_user_id (foreign key)
skill_vote (integer: -1, 0, +1)
sportsmanship_vote (integer: -1, 0, +1)
created_at
game_id (foreign key for context)
Relationships

1:1
RSVP
— Each RSVP can generate one peer feedback entry per other attendee, submitted within 48 hours post-game.
N:N
User
— Feedback connects two users (giver and recipient), with anti-abuse logic preventing reciprocal negative feedback spam.
N:N
SkillRating
— Peer feedback entries are aggregated to update skill ratings using weighted average based on feedback giver's rating confidence.
Notification
Push notification log tracking all messages sent to users (game reminders, cancellations, chat messages) with delivery status and user preferences.

Attributes

notification_id (UUID primary key)
user_id (foreign key)
notification_type (game_reminder/cancellation/chat_message/waitlist_promotion)
game_id (foreign key, nullable)
title
body
sent_at
delivered (boolean)
opened (boolean)
user_preference_honored (boolean, checks quiet hours)
Relationships

N:N
User
— Each user receives multiple notifications, with preferences controlling which types are delivered and when.
N:N
Game
— Game-related notifications reference specific games, enabling users to tap notification and jump directly to game details.
Risk Assessment
Market
1 risk

Network effects cold start problem - app is useless without critical mass of games in each city, requiring simultaneous user acquisition across both game creators and participants

P: high
I: high
Expand
Technical
1 risk

Offline-first architecture complexity causing data sync conflicts and user confusion when RSVPs made offline conflict with server state

P: medium
I: high
Expand
Financial
1 risk

Inability to achieve 5-10% freemium conversion rate due to core features being too good, eliminating premium upgrade motivation

P: medium
I: medium
Expand
Operational
1 risk

Dependence on single developer for 12-week MVP timeline - illness, burnout, or scope creep could delay launch past critical summer sports season window

P: medium
I: high
Expand
Competitive
1 risk

Established competitors (TeamSnap, Meetup) launch pickup sports features after seeing PickupPro traction, leveraging existing user bases to crush nascent network effects

P: low
I: high
Expand
Market Segments
Market Size by Segment (in millions)
Urban Recreational Athletes
Suburban Sports Organizers
College/Young Professional Fitness Seekers
$0M
$15M
$30M
$45M
$60M
Segment	Size	Growth	Our Share
Urban Recreational Athletes	$42M	8.5%	0.05%
Suburban Sports Organizers	$28M	5.2%	0.02%
College/Young Professional Fitness Seekers	$18M	12.3%	0.08%
Development Timeline
Phase 1
3 weeks
Foundation & Core Infrastructure
Milestones

•
Railway production environment live with PostgreSQL, Redis, and automated deployments
•
OAuth2 authentication flow complete with Google and Apple Sign-In, JWT refresh tokens persisting 30 days
•
Service Worker implemented with offline game list caching and background sync
Deliverables

Backend API with /auth, /games, /users endpoints deployed and load-tested to 1000 req/sec
React Native app scaffolding with navigation, state management (Zustand), and offline detection
Database schema deployed with users, games, rsvps, and locations tables including PostGIS extension
Phase 2
4 weeks
Core Game Features
Milestones

•
Game creation flow complete with Google Maps location picker, skill level selector, and recurring game templates
•
RSVP system functional with real-time updates via Supabase subscriptions, waitlist management for full games
•
Game discovery with MapView showing pins for nearby games, list view with filters (sport, skill level, distance)
Deliverables

Game detail screen showing attendees, organizer contact, venue details, weather forecast (OpenWeather API)
Push notification system for game reminders (24hr, 2hr before start), cancellations, and waitlist promotions
Transparent skill rating system displaying ELO-style scores with methodology explanation, no pay-to-boost
Phase 3
3 weeks
Polish & Testing
Milestones

•
Private beta with 50 Austin users completing 100+ test games, collecting crash reports and UX feedback
•
Performance optimization achieving <2s cold start, <500ms API response p95, offline mode tested with airplane mode cycling
•
App Store submission with assets (screenshots, app preview video, privacy policy) and TestFlight build for reviewers
Deliverables

Automated test suite with 80% backend coverage and critical path integration tests (auth, RSVP, game creation)
Production monitoring with Sentry error tracking, Railway metrics dashboard, and PagerDuty alerts for API downtime
Marketing landing page (pickuppro.app) with email capture, demo video, and Product Hunt launch assets prepared
Phase 4
2 weeks
Launch & Iteration
Milestones

•
Public launch in Austin with Product Hunt feature, Reddit posts in r/Austin and r/pickupbasketball
•
First 500 users acquired with 65%+ WAU/MAU ratio, 20+ active games per week, <5% crash-free rate
•
Week 1 hotfix release addressing top 3 user-reported issues, week 2 feature iteration based on usage analytics
Deliverables

Launch retrospective documenting user acquisition costs ($2.80 CPA via Reddit, $8.50 via Instagram ads), conversion funnels, and retention cohorts
V1.1 roadmap prioritizing top feature requests (in-app chat ranked #1, game history ranked #2 from beta feedback)
Expansion plan for city #2 (Denver) targeting month