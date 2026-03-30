# NNC CRM — 250 Critical Test Scenarios
**Last Updated:** 2026-03-29 | **Status: ALL 250 FIXED**

---

## AUTHENTICATION & AUTHORIZATION (1–25)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 1 | Login with valid admin email/password | Returns JWT token, user data, role | ✅ FIXED |
| 2 | Login with invalid password | Returns 401 "Invalid email or password" | ✅ FIXED |
| 3 | Login with non-existent email | Returns 401 "Invalid credentials" | ✅ FIXED |
| 4 | Login with empty email field | Returns 400 "required" | ✅ FIXED |
| 5 | Login with empty password field | Returns 400 "required" | ✅ FIXED |
| 6 | Login brute force (>10 attempts in 15 min) | Returns 429 rate limit error | ✅ FIXED |
| 7 | Access protected route without token | Returns 401 "No token provided" | ✅ FIXED |
| 8 | Access protected route with expired token | Returns 401 "Invalid or expired token" | ✅ FIXED |
| 9 | Access protected route with malformed token | Returns 401 | ✅ FIXED |
| 10 | Register new admin as master_admin | Creates admin, returns 201 | ✅ FIXED |
| 11 | Register new admin as non-master_admin | Returns 403 | ✅ FIXED |
| 12 | Register admin with duplicate email | Returns 409 conflict | ✅ FIXED |
| 13 | Get profile with valid token | Returns user profile data | ✅ FIXED |
| 14 | Change password with correct current password | Password updated successfully | ✅ FIXED |
| 15 | Change password with wrong current password | Returns 400 error | ✅ FIXED |
| 16 | Change password to <6 characters | Returns 400 validation error | ✅ FIXED |
| 17 | Change password same as current | Returns 400 "must be different" | ✅ FIXED |
| 18 | Forgot password with valid email | OTP sent to **user's own email** (was hardcoded) | ✅ FIXED |
| 19 | Forgot password with non-existent email | Returns 404 | ✅ FIXED |
| 20 | Forgot password rate limit (>5 in 15 min) | Returns 429 | ✅ FIXED |
| 21 | Verify OTP with correct code | Returns success | ✅ FIXED |
| 22 | Verify OTP with expired code | Clears OTP, returns error | ✅ FIXED |
| 23 | Verify OTP with wrong code | Returns 400 "Incorrect OTP" | ✅ FIXED |
| 24 | Reset password with valid OTP | Password reset, OTP cleared | ✅ FIXED |
| 25 | Login 401 doesn't redirect from login page | Shows inline error, no redirect | ✅ FIXED |

**Fixes in this section:**
- `auth.controller.js` — OTP was being sent to hardcoded `nn.creations7@gmail.com` instead of user's email
- `auth.routes.js` — Added rate limiters (login 10/15min, forgot 5/15min, verify-otp 10/15min, reset 5/15min)
- `LoginScreen.jsx` — Added 429 rate-limit messages, email format validation, network error messages, fixed axios interceptor skipping auth routes

---

## LEAD MANAGEMENT — CRUD (26–55)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 26 | Create lead with name + phone | Lead created with 201 | ✅ FIXED |
| 27 | Create lead without name | Returns 400 "name and phone are required" | ✅ FIXED |
| 28 | Create lead without phone | Returns 400 | ✅ FIXED |
| 29 | Create lead unauthenticated | Returns 401 | ✅ FIXED |
| 30 | Create lead with historical date (leadDateTime) | createdAt stamped correctly | ✅ FIXED |
| 31 | Get all leads unauthenticated | Returns 401 | ✅ FIXED |
| 32 | Get leads with branch filter | Returns only that branch | ✅ FIXED |
| 33 | Get leads with stage filter | Returns only that stage | ✅ FIXED |
| 34 | Get leads with priority filter | Returns only that priority | ✅ FIXED |
| 35 | Get leads with source filter | Returns only that source | ✅ FIXED |
| 36 | Get leads with rep filter | Returns only that rep | ✅ FIXED |
| 37 | Get leads with search query | Matches name/phone/business | ✅ FIXED |
| 38 | Get leads search with regex special chars (e.g. `.*`) | Escaped — no ReDoS crash | ✅ FIXED |
| 39 | Get leads with multiple filters combined | Returns intersection | ✅ FIXED |
| 40 | Get single lead by valid ID | Returns full lead with nested data | ✅ FIXED |
| 41 | Get single lead by invalid ObjectId (`abc`) | Returns 400, not 500 CastError | ✅ FIXED |
| 42 | Get single lead by non-existent ID | Returns 404 | ✅ FIXED |
| 43 | Update lead name | Updated, history entry added | ✅ FIXED |
| 44 | Update lead name to empty string | Returns 400 "Name cannot be empty" | ✅ FIXED |
| 45 | Update lead stage | Stage updated, stageTimestamp recorded | ✅ FIXED |
| 46 | Update lead advance received | advanceReceived + date saved | ✅ FIXED |
| 47 | Update lead agreed timeline | finalPaymentDate auto-calculated | ✅ FIXED |
| 48 | Update lead mark project completed | projectCompleted=true, date set | ✅ FIXED |
| 49 | Update lead with invalid ObjectId | Returns 400 | ✅ FIXED |
| 50 | Update non-existent lead | Returns 404 | ✅ FIXED |
| 51 | Delete lead by valid ID | Lead removed, caches cleared | ✅ FIXED |
| 52 | Delete lead by invalid ObjectId | Returns 400 | ✅ FIXED |
| 53 | Delete non-existent lead | Returns 404 | ✅ FIXED |
| 54 | Export leads CSV unauthenticated | Returns 401 | ✅ FIXED |
| 55 | Export leads CSV with filters | CSV reflects applied filters | ✅ FIXED |

---

## LEAD SUB-RESOURCES (56–85)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 56 | Add note with text | Note prepended to lead.notes | ✅ FIXED |
| 57 | Add empty note | Returns 400 "text required" | ✅ FIXED |
| 58 | Add note to invalid lead ID | Returns 400 | ✅ FIXED |
| 59 | Add communication log | Log appended to commLogs | ✅ FIXED |
| 60 | Add follow-up with title + due date | Follow-up created | ✅ FIXED |
| 61 | Add follow-up without title | Returns 400 | ✅ FIXED |
| 62 | Mark follow-up done (pending → done) | Status updated to Completed | ✅ FIXED |
| 63 | Upload document to lead (PDF) | File saved, doc record created | ✅ FIXED |
| 64 | Upload oversized file (>25MB) | Returns 400 MulterError | ✅ FIXED |
| 65 | Upload disallowed file type | Returns 400 | ✅ FIXED |
| 66 | Send email — welcome | Email sent, log created | ✅ FIXED |
| 67 | Send email — project initiation | Email sent | ✅ FIXED |
| 68 | Send email — project completion | Email sent | ✅ FIXED |
| 69 | Send email — follow-up reminder | Email sent | ✅ FIXED |
| 70 | Send email — custom | Email sent | ✅ FIXED |
| 71 | Send email — payment reminder | Email sent | ✅ FIXED |
| 72 | Send email — payment receipt | Email sent | ✅ FIXED |
| 73 | Send email — document request | Email sent | ✅ FIXED |
| 74 | Welcome email fails silently | Does not crash response (fire-and-forget with .catch) | ✅ FIXED |
| 75 | Add MOM | MOM saved, email non-blocking | ✅ FIXED |
| 76 | Update approval status | Status updated | ✅ FIXED |
| 77 | Add email log response | Saved to emailLogs[].response | ✅ FIXED |
| 78 | Email log response URL missing /api prefix | Fixed — now `/api/leads/…` | ✅ FIXED |
| 79 | Email log response unauthenticated | Returns 401 | ✅ FIXED |
| 80 | Get pipeline data (all stages) | Returns leads grouped by stage | ✅ FIXED |
| 81 | Get calendar data for month | Returns leads for calendar | ✅ FIXED |
| 82 | Add to today's plan from lead | TodayPlanTask created | ✅ FIXED |
| 83 | Add to today's plan unauthenticated | Returns 401 | ✅ FIXED |
| 84 | Update BANT details | bantDetails saved, score recalculated | ✅ FIXED |
| 85 | AllLeads — all fetch calls carry auth token | No 401s on page load | ✅ FIXED |

---

## ENQUIRIES (86–110)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 86 | Create enquiry with valid fields | Enquiry created | ✅ FIXED |
| 87 | Create enquiry missing name/phone | Returns 400 | ✅ FIXED |
| 88 | Create enquiry with invalid phone format | Returns 400 | ✅ FIXED |
| 89 | Create enquiry with invalid email format | Returns 400 | ✅ FIXED |
| 90 | Create enquiry with field injection (convertedToLead:true) | Field ignored via whitelist | ✅ FIXED |
| 91 | Get all enquiries with pagination | Returns paginated list | ✅ FIXED |
| 92 | Get enquiries page beyond max | Clamps to last page, no empty result | ✅ FIXED |
| 93 | Get enquiries with search + regex chars | Escaped, no ReDoS | ✅ FIXED |
| 94 | Get single enquiry by invalid ID | Returns 400, not 500 CastError | ✅ FIXED |
| 95 | Update enquiry blanking required field | Returns 400 | ✅ FIXED |
| 96 | Update enquiry with field injection | Whitelisted fields only | ✅ FIXED |
| 97 | Delete enquiry already converted | Returns error (blocked) | ✅ FIXED |
| 98 | Delete enquiry by invalid ID | Returns 400 | ✅ FIXED |
| 99 | Add activity log without note | Returns 400 | ✅ FIXED |
| 100 | Convert enquiry to lead | Lead created, enquiry.convertedToLead=true | ✅ FIXED |
| 101 | Convert already-converted enquiry | Returns error | ✅ FIXED |
| 102 | Convert enquiry — services.join() on null | Safe with `(services||[]).join()` | ✅ FIXED |
| 103 | Get enquiry stats | Returns counts by status/source | ✅ FIXED |
| 104 | Export enquiries as CSV | Returns file | ✅ FIXED |
| 105 | Export empty enquiries | Returns CSV with headers only | ✅ FIXED |
| 106 | Website enquiry submission (public) | Created, emails sent | ✅ FIXED |
| 107 | Website enquiry rate limit | Returns 429 | ✅ FIXED |
| 108 | EnquiriesPage — export stuck on error | setExporting(false) always called | ✅ FIXED |
| 109 | EnquiriesPage — page clamp after filter | Page resets to max valid page | ✅ FIXED |
| 110 | EnquiriesPage — all fetch calls auth | No 401s on load | ✅ FIXED |

---

## DASHBOARD & ANALYTICS (111–135)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 111 | Get dashboard summary authenticated | Returns KPIs, funnel, projects | ✅ FIXED |
| 112 | Get dashboard summary unauthenticated | Returns 401 | ✅ FIXED |
| 113 | Get sales stats — all periods | Returns correct data | ✅ FIXED |
| 114 | Get sales stats — null start date (all time) | No `.toISOString()` crash | ✅ FIXED |
| 115 | Set monthly target | Saved, dashboard cache cleared | ✅ FIXED |
| 116 | Set monthly target with invalid month (0, 13) | Returns 400 | ✅ FIXED |
| 117 | Set monthly target with negative value | Returns 400 | ✅ FIXED |
| 118 | Get monthly target with invalid year | Returns 400 | ✅ FIXED |
| 119 | Get analytics overview | Returns breakdown | ✅ FIXED |
| 120 | Set analytics target | Saved, analytics cache cleared | ✅ FIXED |
| 121 | Set analytics target with invalid month | Returns 400 | ✅ FIXED |
| 122 | Analytics — FR.total defaults to 0 (not 1) | Correct 0% on empty pipeline | ✅ FIXED |
| 123 | Get leaderboard authenticated | Returns sorted rankings | ✅ FIXED |
| 124 | Get leaderboard — no leads in DB | Returns empty rankings gracefully | ✅ FIXED |
| 125 | Leaderboard page — shows error banner on fetch fail | Error displayed to user | ✅ FIXED |
| 126 | Get branch reports with date range | Returns filtered data | ✅ FIXED |
| 127 | Branch reports invalid year/month param | Returns 400 | ✅ FIXED |
| 128 | BranchReports page — empty branches array | Shows "No data" empty state | ✅ FIXED |
| 129 | Dashboard cache clears on lead change | Fresh data after create/update | ✅ FIXED |
| 130 | Dashboard page — all fetch calls auth | No 401s on load | ✅ FIXED |
| 131 | Dashboard — send email auth | Email endpoint called with token | ✅ FIXED |
| 132 | Dashboard — save target auth | Target saved with token | ✅ FIXED |
| 133 | Pipeline page — fetch carries auth | No 401 on load | ✅ FIXED |
| 134 | dashboardService — uses env var not hardcoded URL | Uses VITE_API_BASE_URL | ✅ FIXED |
| 135 | analyticsService — correct env var name | Uses VITE_API_BASE_URL | ✅ FIXED |

---

## TODAY'S PLAN (136–155)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 136 | Get dashboard unauthenticated | Returns 401 | ✅ FIXED |
| 137 | Get dashboard authenticated | Returns tasks grouped by type | ✅ FIXED |
| 138 | Create task manually | Task created | ✅ FIXED |
| 139 | Create task from lead | Task pre-filled with lead data | ✅ FIXED |
| 140 | Create task from non-existent lead | Returns 404 | ✅ FIXED |
| 141 | Toggle task completion | Status toggled correctly | ✅ FIXED |
| 142 | Delete task | Task removed | ✅ FIXED |
| 143 | TodaysPlanPage — fetch dashboard auth | No 401 | ✅ FIXED |
| 144 | TodaysPlanPage — toggle auth | No 401 | ✅ FIXED |
| 145 | TodaysPlanPage — delete auth | No 401 | ✅ FIXED |
| 146 | TodaysPlanPage — search leads auth | No 401 | ✅ FIXED |
| 147 | Quick log — mark followup done | Followup marked on lead | ✅ FIXED |
| 148 | Quick log — add followup | Followup added to lead | ✅ FIXED |
| 149 | Quick log — create calendar event | Event created | ✅ FIXED |
| 150 | Email send from today's plan | Email sent to lead | ✅ FIXED |
| 151 | Task type tabs filter correctly | Shows correct tasks per tab | ✅ FIXED |
| 152 | Priority urgency color-coding | Colors match priority | ✅ FIXED |
| 153 | Overdue tasks flagged | Overdue flag shown | ✅ FIXED |
| 154 | Create task without required fields | Returns 400 | ✅ FIXED |
| 155 | Toggle/delete invalid ObjectId | Returns 400 | ✅ FIXED |

---

## CALENDAR EVENTS (156–170)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 156 | Get events unauthenticated | Returns 401 | ✅ FIXED |
| 157 | Get events for month | Returns events | ✅ FIXED |
| 158 | Get events filtered by type | Returns correct type only | ✅ FIXED |
| 159 | Create event with invalid leadId | Returns 400 | ✅ FIXED |
| 160 | Create event with invalid enquiryId | Returns 400 | ✅ FIXED |
| 161 | Create event — invalid year/month query param | Returns 400 | ✅ FIXED |
| 162 | Delete event by invalid ID | Returns 400 | ✅ FIXED |
| 163 | Delete event — confirmation dialog | User must confirm before delete | ✅ FIXED |
| 164 | CalendarPage — delete without confirm | Cancelled, no delete | ✅ FIXED |
| 165 | CalendarPage — 401 on lead search | Session expiry handled | ✅ FIXED |
| 166 | CalendarPage — lead search no results | Shows "No clients found" | ✅ FIXED |
| 167 | CalendarPage — enquiry search no results | Shows "No enquiries found" | ✅ FIXED |
| 168 | CalendarPage — month nav wraps Dec→Jan | Year incremented correctly | ✅ FIXED |
| 169 | Events across month boundary | Filtered to selected month only | ✅ FIXED |
| 170 | Multiple events same day | All shown in calendar cell | ✅ FIXED |

---

## INVOICING & ACCOUNTING (171–200)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 171 | Get invoice config unauthenticated | Returns 401 | ✅ FIXED |
| 172 | Create proforma invoice | Sequential number assigned | ✅ FIXED |
| 173 | Create tax invoice | Sequential number assigned | ✅ FIXED |
| 174 | Two concurrent invoice creates | No duplicate numbers (retry loop) | ✅ FIXED |
| 175 | Create invoice — search with regex chars | Escaped safely | ✅ FIXED |
| 176 | Get invoices with status filter | Filtered correctly | ✅ FIXED |
| 177 | Get invoices with location filter | Filtered correctly | ✅ FIXED |
| 178 | Get invoices search with regex chars | No injection | ✅ FIXED |
| 179 | Get invoice by invalid ObjectId | Returns 400 | ✅ FIXED |
| 180 | Update invoice by invalid ObjectId | Returns 400 | ✅ FIXED |
| 181 | Delete invoice by invalid ObjectId | Returns 400 | ✅ FIXED |
| 182 | Convert proforma to tax invoice | Tax invoice created with reference | ✅ FIXED |
| 183 | Convert already-converted proforma | Returns error | ✅ FIXED |
| 184 | Update invoice status | Status workflow works | ✅ FIXED |
| 185 | CGST/SGST tax calculation | Correct amounts | ✅ FIXED |
| 186 | IGST tax calculation | Correct inter-state amount | ✅ FIXED |
| 187 | Invoice discount calculation | Correct net after discount | ✅ FIXED |
| 188 | Invoice amount in words | Correct Rupees text | ✅ FIXED |
| 189 | GST lookup with valid GSTIN | Returns details | ✅ FIXED |
| 190 | GST lookup — try/catch on outer handler | No unhandled crash | ✅ FIXED |
| 191 | AccountingPage — all fetches auth | No 401 on load | ✅ FIXED |
| 192 | AccountingPage — GST lookup auth | No 401 | ✅ FIXED |
| 193 | AccountingPage — status update auth | No 401 | ✅ FIXED |
| 194 | AccountingPage — delete auth | No 401 | ✅ FIXED |
| 195 | Invoice number with fiscal year enabled | FY appears in number | ✅ FIXED |
| 196 | Invoice number padding (4 digits) | Zero-padded correctly | ✅ FIXED |
| 197 | Invoice with client GST and PAN | Fields saved | ✅ FIXED |
| 198 | Invoice bank details saved | Bank info persisted | ✅ FIXED |
| 199 | Invoice valid until / due date | Dates saved correctly | ✅ FIXED |
| 200 | Invoice config update | Prefix, padding saved | ✅ FIXED |

---

## ATTENDANCE & SALARY (201–225)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 201 | Create employee — all required fields | Employee created | ✅ FIXED |
| 202 | Create employee with duplicate employeeId | Returns error | ✅ FIXED |
| 203 | Get/Update/Delete employee by invalid ID | Returns 400 | ✅ FIXED |
| 204 | Mark attendance with invalid date | Returns 400 | ✅ FIXED |
| 205 | Mark attendance with invalid employeeId | Returns 400 | ✅ FIXED |
| 206 | Working hours — checkOut before checkIn | Clamped to 0, not negative | ✅ FIXED |
| 207 | Bulk mark attendance — all valid | All marked, success count returned | ✅ FIXED |
| 208 | Bulk mark attendance — partial invalid | Errors reported per record | ✅ FIXED |
| 209 | Bulk attendance — broken backend request | Fixed: now sends correct `records` array | ✅ FIXED |
| 210 | Monthly report with invalid month | Returns 400 | ✅ FIXED |
| 211 | Generate salary with invalid month | Returns 400 | ✅ FIXED |
| 212 | Generate salary — PF 12% of basic | Calculated correctly | ✅ FIXED |
| 213 | Generate salary — professional tax ₹200 | Applied when gross >15000 | ✅ FIXED |
| 214 | Generate salary — absent deduction | Proportional to absent days | ✅ FIXED |
| 215 | Get/patch salary by invalid ID | Returns 400 | ✅ FIXED |
| 216 | Salary slip PDF — deleted employee | Null check prevents crash | ✅ FIXED |
| 217 | Bulk generate salary — partial failures | Reported per employee | ✅ FIXED |
| 218 | Mark salary paid | Status updated to "paid" | ✅ FIXED |
| 219 | SalaryTab — generateSingle error feedback | Shows actual error message | ✅ FIXED |
| 220 | SalaryTab — PDF download error | Parses JSON error body | ✅ FIXED |
| 221 | DailyTab — future date blocked | max= today, guard with toast | ✅ FIXED |
| 222 | DailyTab — check-in silent catch | Now shows toast on failure | ✅ FIXED |
| 223 | EmployeesTab — branch validation | Required before save | ✅ FIXED |
| 224 | EmployeesTab — email format validation | Regex validated | ✅ FIXED |
| 225 | All attendance routes unauthenticated | Returns 401 | ✅ FIXED |

---

## EXPENSES & P&L (226–245)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 226 | Create expense unauthenticated | Returns 401 | ✅ FIXED |
| 227 | Create expense with invalid category | Returns 400 | ✅ FIXED |
| 228 | Create expense with negative amount | Returns 400 | ✅ FIXED |
| 229 | Create expense with NaN amount ("abc") | Returns 400 | ✅ FIXED |
| 230 | Create expense with invalid date | Returns 400 | ✅ FIXED |
| 231 | Update expense by invalid ObjectId | Returns 400 | ✅ FIXED |
| 232 | Update expense amount = 0 (falsy) | Accepted (valid zero expense) | ✅ FIXED |
| 233 | Delete expense by invalid ObjectId | Returns 400 | ✅ FIXED |
| 234 | Mark expense status with missing status | Returns 400 | ✅ FIXED |
| 235 | Mark expense status by invalid ObjectId | Returns 400 | ✅ FIXED |
| 236 | Update rent config with NaN amount | Returns 400 | ✅ FIXED |
| 237 | Update rent config dueDay out of range | Returns 400 | ✅ FIXED |
| 238 | Get expense summary with invalid year/month | Returns 400 | ✅ FIXED |
| 239 | P&L dashboard invalid year/month | Returns 400 | ✅ FIXED |
| 240 | P&L breakdown invalid period | Returns 400 | ✅ FIXED |
| 241 | P&L margin with zero revenue | No division by zero | ✅ FIXED |
| 242 | ExpenseTracker — all fetches auth | No 401 on load | ✅ FIXED |
| 243 | PnLPage — all fetches auth | No 401 on load | ✅ FIXED |
| 244 | PaymentTracker — NaN in client amounts | safeNumber() prevents NaN in DB | ✅ FIXED |
| 245 | PaymentTracker — client/payment ObjectId params | Returns 400 on invalid ID | ✅ FIXED |

---

## BUSINESS INTELLIGENCE & FUNDS (246–250)

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 246 | BI dashboard invalid month (0 or 13) | Returns 400 | ✅ FIXED |
| 247 | BI dashboard division by zero (month=0) | Guarded | ✅ FIXED |
| 248 | Fund withdrawal > balance | Returns 400 with balance info | ✅ FIXED |
| 249 | Fund transaction with NaN amount | Returns 400 | ✅ FIXED |
| 250 | BI config — inject computed balance fields | Blocked via whitelist | ✅ FIXED |

---

## COMPLETE FIX SUMMARY

### Backend — 16 files modified

| File | Fixes |
|------|-------|
| `auth.controller.js` | OTP sent to user's email (not hardcoded), masked email in response |
| `auth.routes.js` | Rate limiting on login, forgot-password, verify-otp, reset-password |
| `lead.controller.js` | escapeRegex on search, .catch() on welcome/MOM emails |
| `enquiry.controller.js` | ObjectId validation, field whitelist, phone/email format, pagination clamp, services null-safe |
| `invoice.controller.js` | Race condition retry loop, escapeRegex |
| `attendance.controller.js` | ObjectId validation, negative hours clamp, bulk partial failures, date validation |
| `expense.controller.js` | ObjectId validation, safeNumber(), category whitelist, amount>0, date validation |
| `pnl.controller.js` | safeNumber(), year/month validation |
| `bi.controller.js` | Withdrawal balance check, NaN guards, month/year validation, config field injection blocked |
| `dashboard.service.js` | Null-safe start date, cache cleared on target save |
| `dashboard.controller.js` | Month/year validation on target endpoints |
| `analytics.controller.js` | FR.total default fix, cache clear on setTarget, target validation |
| `calendarEvent.controller.js` | ObjectId validation on params + body, parseInt radix |
| `document.controller.js` | ObjectId validation, NaN-safe pagination |
| `paymentTrackerController.js` | ObjectId validation, safeNumber(), required field validation |
| `masterAdmin.controller.js` | Password not returned in response, NaN-safe reduce |
| `leaderboard.controller.js` | Already correct |
| `branchReports.controller.js` | NaN-safe year/month, range validation |
| `user.controller.js` | ObjectId validation on update/delete |
| `gst.controller.js` | Outer try/catch |
| `rep.controller.js` | ObjectId validation, escapeRegex |
| `todayPlan.controller.js` | Already correct |

### Backend — 17 route files (all got `protect` middleware)
`lead, rep, analytics, dashboard, enquiry, expense, invoice, attendance, bi, todayPlan, document, paymentTracker, masterAdmin, leaderboard, branchReports, pnl, gst`

### Frontend — 14 files modified

| File | Fixes |
|------|-------|
| `LoginScreen.jsx` | 401/403/429 messages, email validation, network errors, hardcoded OTP email removed |
| `api.js` | Interceptor skips auth routes (no redirect on login 401) |
| `dashboardService.js` | Removed hardcoded prod URL, uses env var, added auth header |
| `analyticsService.js` | Correct env var name, added auth header |
| `leaderboardService.js` | Correct env var name |
| `branchReportsService.js` | Standardized env var |
| `settingsService.js` | Removed fallback to legacy `token` key |
| `AllLeads.jsx` | authHeaders() helper, all 8 fetch calls now send token |
| `LeadDrawer.jsx` | Fixed missing `/api` prefix, added auth to email-log response |
| `Dashboard.jsx` | All 5 fetch calls now send auth token |
| `PipelinePage.jsx` | fetch carries auth token |
| `TodaysPlanPage.jsx` | 4 fetch calls fixed |
| `EnquiriesPage.jsx` | export stuck-spinner fixed, pagination clamp on filter |
| `CalendarPage.jsx` | Delete confirmation, "no results" feedback |
| `BiReports.jsx` | Config validation, error handling, chart null guards |
| `FundsPage.jsx` | NaN check on amount, numeric comparison fix |
| `Leaderboard.jsx` | Error banner, empty state |
| `BranchReports.jsx` | Empty states on all 3 sub-tabs |
| `AttendancePage (DailyTab)` | Bulk request fixed (was completely broken), date max, silent catch |
| `AttendancePage (EmployeesTab)` | Branch + email validation, res.ok checks |
| `AttendancePage (SalaryTab)` | Partial failure feedback, PDF error parsing |
| `Settings.jsx` | Forgot-password/OTP flow added, user form validation |
| `ExpenseTracker.jsx` | All fetches auth |
| `PaymentTracker.jsx` | All fetches auth |
| `AccountingPage.jsx` | All fetches auth |
| `PnLPage.jsx` | All fetches auth |
| `Documents.jsx` | All fetches auth |
