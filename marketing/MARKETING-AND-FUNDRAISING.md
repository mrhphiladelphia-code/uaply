# UAply: Marketing and Fundraising Plan

Goal: 200-300 users in 14 days, then use that traction to raise money.
Written 2026-10-13. Facts marked (verify) came from secondary sources and must be checked on the official page first.

## 1. The honest order of operations

Funders in 2026 are slow and want proof. Investors are taking more time and want clear goals and customer traction. So users come first and money second. Everything below is ordered by that rule.

1. Days 1-3: set up tracking (UTM links, a QR code that redirects, a simple signup count) and a waitlist/landing page.
2. Days 3-14: get 200-300 users from campuses plus online communities.
3. Day 14 onward: apply for non-dilutive money (grants, pitch competitions), then consider a Kickstarter or small pre-seed.

## 2. Getting users (the 200-300 target)

Realistic funnel: a flyer or post impression converts to scan/click at roughly 1-3%, and click to signup at roughly 20-40%. So 300 users needs about 1,000-2,500 real clicks. Plan for that, not for "going viral".

What worked for comparable student startups (self-reported, so treat as rough):
- Freshlink handed out 750+ T-shirts at a campus fest and got 200+ student accounts in about ten weeks.
- Gradloop (job-matching) got about 150 signups in two weeks through career fairs and asking a fraternity to join.
- Start with the 20 people who feel the problem most (job-hunting juniors/seniors), not friends who are merely supportive.

Channels, ranked by expected payoff for UAply:
1. Career-center and club partnerships (Penn, Drexel, Temple, plus Villanova, La Salle, Saint Joseph's, CCP). Ask for a slot in a newsletter, a class announcement, or a table at a career fair. Highest conversion because the audience is actively job hunting.
2. In-person QR flyers and table days at student centers and libraries (see section 4).
3. Reddit: r/Philadelphia, r/UPenn, r/Drexel, r/Temple, r/jobs, r/internships, r/csMajors, r/resumes, r/SideProject, r/startups. Each has its own self-promotion rule. Read it first.
4. Discord and GroupMe: campus servers, major-specific groups.
5. Product Hunt launch (a one-day spike; useful for credibility, not core user growth).
6. Instagram/TikTok short demos of the swipe interaction. The swipe-to-apply concept demos well in 15 seconds.
7. LinkedIn posts from the founder, since the audience is job seekers.

## 3. Platforms and posting rules (important for the "post every day" idea)

You asked for daily automatic posts, to start only when you say so. Findings on that:

- Reddit: automated posting is the fastest way to get banned. Reddit's spam systems judge account history, not single posts. The community norm is 90/10 (nine helpful non-promotional contributions per one promotional post). Many subreddits ban or restrict self-promotion or require karma first. Reddit API access has also tightened: commercial use needs a separate agreement and new OAuth access reportedly is limited (verify). Scraping is prohibited.
- Product Hunt: launches happen once, not daily. Vote manipulation and bots are discouraged. There is nothing to post daily.
- Kickstarter: one campaign with a goal and deadline, not a daily feed. Platform fee about 5% plus 3-5% payment processing, charged only on success (verify). It requires an audience before launch.
- What is safe to automate: scheduling on your own accounts (Instagram, TikTok, X, LinkedIn). The Metricool connector in this workspace can schedule posts and create drafts for review.

Recommendation: when you say go, I will draft a week of posts per platform (tailored to each subreddit's rules) and you approve and submit each Reddit/Product Hunt post yourself. I can schedule posts on your own social accounts after you confirm. I will not run an unattended Reddit or Product Hunt posting bot.

## 4. QR codes

- Use a dynamic QR code (redirects through a short link) so you can see scan counts and change the destination after printing. Static codes cannot be tracked or edited.
- Tag every placement with UTM parameters, for example `?utm_source=flyer&utm_medium=qr&utm_campaign=penn_oct&utm_content=library`. Keep lowercase; UTM values are case-sensitive.
- Use a different code per campus and per placement so you learn which locations work.
- Print a clear one-line promise ("Swipe right on a job. Apply in one tap.") and put the code at least about 1 inch square. Test on three phones before printing.
- Need a real count of signups: add a simple counter or analytics event on signup; scans alone are not users.

## 5. Philadelphia funding map

Verify every deadline and amount on the official page.

| Source | What | Eligibility notes |
|---|---|---|
| Penn Venture Lab / Penn Wharton Innovation Fund | $1,000 Design and $2,000 Build awards; decided by student investment team | Currently enrolled Penn degree students |
| Temple Fox IEI: Be Your Own Boss Bowl | Largest local student prize; reported grand prize $30K-$60K plus in-kind (sources differ); fall track for early ideas, spring track for later stage; 1810 Accelerator | Temple students, alumni, faculty, staff |
| Drexel Baiada Institute / Close School | Innovation Tournament, four $5,000 awards with a year of incubation; Startup Fest; incubator space | Drexel students and alumni |
| Philadelphia Regional Startup World Cup | City-run pitch; 2026 round already held Sept 18 at Temple; watch for the 2027 call | Tech startups in Philadelphia |
| Ben Franklin Technology Partners SEP: Road to LionCage | Six regional pitch competitions, March-October, open to all founders | Check remaining dates |
| City Business Summit Pitch Competition | $10K / $5K / $2.5K; held May 2026 | Needs Philadelphia business license and EIN |
| Dorm Room Fund, Osage University Partners, Center City Ventures (Wharton student fund, raising about $750K) | Student/pre-seed venture | Verify current activity |

Practical step: pick the one affiliated with whichever school you or a teammate attend. A Penn or Temple student status unlocks money that outsiders cannot get.

## 6. Kickstarter and other raising options

- Kickstarter suits physical products and creative projects. A free web app has no natural reward tier; it is a weak fit unless you sell something (lifetime Pro, early-supporter perks) and bring your own audience. Expect to need hundreds of engaged people before launch.
- Better first money for this stage: grants and pitch competitions (non-dilutive), then a small angel or student fund check once you show usage numbers.
- Open Collective, GitHub Sponsors, and Buy Me a Coffee exist but raise small amounts.

## 7. Ads and AdSense

- AdSense is for websites. Google's stated bar is original content that follows its policies and an adult owner; reviewers also check design, real traffic, and domain. A free subdomain (like github.io) makes approval much harder, so get a custom domain first (verify).
- AdMob is for native mobile apps; UAply is currently a web app.
- Revenue is small at this scale. A third-party estimate for 10,000 monthly users is about $50-$500 per month (unverified). At 300 users, expect cents to a few dollars. Ads also hurt the swipe experience.
- Better monetization later: recruiter or employer paid listings, sponsored jobs, or a premium tier. Note the existing legal review in `LEGAL-REVIEW.md` before adding any paid placement.
- If you want paid user acquisition, a small test ($50-$100) on Instagram or Reddit ads targeted at Philadelphia students is cheaper to learn from than AdSense.

## 8. Two-week plan

| Days | Actions |
|---|---|
| 1-2 | Landing page, signup counter, UTM scheme, dynamic QR codes, 15-second demo video |
| 3-4 | Email Penn, Drexel, Temple career centers and 10 clubs; join campus Discords and GroupMes; start answering questions on Reddit (no promotion yet) |
| 5-7 | Print flyers; table at two campuses; first soft posts in allowed subreddits; Instagram/TikTok demo daily |
| 8-10 | Follow-up with partner clubs; post feature updates; start Product Hunt prep |
| 11-14 | Product Hunt launch (Friday often has less competition, verify); count users; write a one-page traction summary |
| 15+ | Apply to competitions and grants using the traction summary |

## 9. Metrics to track daily

Scans/clicks per source, signups per source, activation (first swipe), day-2 return. Total signups is the target; the rest tells you what to do more of.

## 10. Decisions needed from you

1. Which school are you or a teammate enrolled in? That decides which grant to chase first.
2. Do you have a custom domain? Needed for AdSense and looks credible on flyers.
3. Which of your own social accounts should I schedule posts on?
4. Do you want me to start drafting the first week of posts and flyer copy?
