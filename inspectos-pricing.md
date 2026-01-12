# InspectOS Pricing

## Pricing Tiers

| Tier | Monthly | Annual | Inspectors | Reports |
|------|---------|--------|------------|---------|
| **Pro** | $79/mo | $790/yr | 1 | Unlimited |
| **Team** | $159/mo | $1,590/yr | 5 included | Unlimited |
| **Business** | $279/mo | $2,790/yr | 15 included | Unlimited |

### Free Trial

- **30 days free** on any plan
- Full features during trial
- No credit card required to start
- Cancel anytime

### Additional Inspectors

| Tier | Per Additional Inspector |
|------|--------------------------|
| Team | +$29/mo each |
| Business | +$25/mo each |

### Annual Discount

- 2 months free (~17% off)
- Pro: $790/yr (vs $948 monthly)
- Team: $1,590/yr (vs $1,908 monthly)
- Business: $2,790/yr (vs $3,348 monthly)

---

## Feature Matrix

| Feature | Pro | Team | Business |
|---------|:---:|:----:|:--------:|
| **Reports & Inspections** |
| Monthly reports | ∞ | ∞ | ∞ |
| Inspectors | 1 | 5 | 15 |
| Offline mode | ✅ | ✅ | ✅ |
| Photo capture | ✅ | ✅ | ✅ |
| Photo annotation | ✅ | ✅ | ✅ |
| PDF reports | ✅ | ✅ | ✅ |
| **Client Experience** |
| Client booking portal | ✅ | ✅ | ✅ |
| Payment collection | ✅ | ✅ | ✅ |
| Client report viewer | ✅ | ✅ | ✅ |
| **Customization** |
| Custom branding | ✅ | ✅ | ✅ |
| Report templates | 3 | ∞ | ∞ |
| Custom checklist items | ✅ | ✅ | ✅ |
| **Productivity** |
| Voice notes | ✅ | ✅ | ✅ |
| Comment library | ✅ | ✅ | ✅ |
| Keyboard shortcuts | ✅ | ✅ | ✅ |
| **Team Features** |
| Team management | ❌ | ✅ | ✅ |
| Inspector scheduling | ❌ | ✅ | ✅ |
| Team calendar | ❌ | ✅ | ✅ |
| Inspector performance | ❌ | ✅ | ✅ |
| **Analytics** |
| Basic analytics | ✅ | ✅ | ✅ |
| Revenue tracking | ✅ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ |
| Custom reports | ❌ | ❌ | ✅ |
| **Integrations & API** |
| Google Calendar sync | ✅ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Webhooks | ❌ | ❌ | ✅ |
| **Support** |
| Help center | ✅ | ✅ | ✅ |
| Email support | ✅ | ✅ | ✅ |
| Priority support | ❌ | ✅ | ✅ |
| Phone support | ❌ | ❌ | ✅ |
| Dedicated success manager | ❌ | ❌ | ✅ |

---

## Payment Processing

### Platform Fee

**0% platform fee** on payments collected through InspectOS.

Inspection companies only pay Stripe's standard processing fees:
- 2.9% + $0.30 per transaction
- Companies can pass this to clients or absorb it

### Stripe Connect

- Each inspection company is a Stripe Connected Account (Express)
- Clients pay the inspection company directly
- InspectOS facilitates the transaction but takes no cut

---

## Competitive Comparison

| Company Size | InspectOS | Spectora | Savings |
|--------------|-----------|----------|---------|
| Solo (1 inspector) | $79/mo | $99/mo | **$240/yr** |
| Small (3 inspectors) | $217/mo | $277/mo | **$720/yr** |
| Medium (5 inspectors) | $159/mo | $455/mo | **$3,552/yr** |
| Large (10 inspectors) | $304/mo | $900/mo | **$7,152/yr** |

*InspectOS Team tier includes 5 inspectors. Spectora charges $89/mo per additional inspector.*

**Plus:** InspectOS offers a 30-day free trial. Spectora does not.

---

## Upgrade Triggers

| Current Tier | Trigger | Prompt |
|--------------|---------|--------|
| Trial | Day 25 of trial | "Your trial ends in 5 days. Choose a plan to keep your data." |
| Trial | Trial expired | "Your trial has ended. Subscribe to continue using InspectOS." |
| Pro | Add 2nd inspector | "Add team members by upgrading to Team." |
| Pro | Try team scheduling | "Team scheduling is available on Team and above." |
| Team | 6th inspector | "You've reached 5 inspectors. Add more for $29/mo each, or upgrade to Business for better per-seat pricing." |
| Team | Try API access | "API access is available on Business." |

---

## Billing Implementation

### Stripe Products

```
Products:
├── inspectos_pro
│   ├── price_pro_monthly      $79/mo
│   └── price_pro_annual       $790/yr
├── inspectos_team
│   ├── price_team_monthly     $159/mo
│   └── price_team_annual      $1,590/yr
├── inspectos_business
│   ├── price_business_monthly $279/mo
│   └── price_business_annual  $2,790/yr
└── inspectos_seat
    ├── price_seat_team        $29/mo (metered)
    └── price_seat_business    $25/mo (metered)

Trial Configuration:
├── trial_period_days: 30
├── payment_method_required: false (collect at end of trial)
└── cancel_at_trial_end: true (if no payment method)
```

### Subscription Schema

```typescript
// Subscription model in database
model Subscription {
  id                String   @id @default(cuid())
  companyId         String   @unique
  company           Company  @relation(fields: [companyId], references: [id])
  
  stripeCustomerId  String   @unique
  stripeSubscriptionId String? // Null during trial if no payment method
  stripePriceId     String
  
  tier              SubscriptionTier  // PRO, TEAM, BUSINESS
  status            SubscriptionStatus // TRIALING, ACTIVE, PAST_DUE, CANCELED, etc.
  billingCycle      BillingCycle // MONTHLY, ANNUAL
  
  // Trial tracking
  trialStartedAt    DateTime?
  trialEndsAt       DateTime?
  
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean @default(false)
  
  // Seat management
  includedSeats     Int      // 1, 5, or 15 based on tier
  additionalSeats   Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum SubscriptionTier {
  PRO
  TEAM
  BUSINESS
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  EXPIRED
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}
```

---

## Free Trial Strategy

### 30-Day Free Trial

- All plans include a 30-day free trial
- Full features available during trial
- No credit card required to start
- Email reminders at day 7, 14, 21, 25, and 29
- Data preserved if user subscribes within 7 days of trial end
- Data deleted 30 days after trial expiration if no subscription

### Trial-to-Paid Conversion Flow

```
Day 1:  Trial starts → Welcome email + onboarding
Day 7:  Check-in email → "How's it going?"
Day 14: Feature highlight → "Did you know you can..."
Day 21: Value reminder → "You've completed X inspections"
Day 25: Urgency → "5 days left in your trial"
Day 29: Final reminder → "Trial ends tomorrow"
Day 30: Trial ends → Convert or pause
Day 37: Last chance → "Your data will be deleted in 7 days"
```

---

## Discounts & Promotions

### Launch Promotion

| Offer | Details |
|-------|---------|
| Early adopter | 50% off first 3 months |
| Annual commitment | Additional month free (3 months free total) |

### Ongoing Discounts

| Discount | Amount | Eligibility |
|----------|--------|-------------|
| Annual billing | 17% (~2 months free) | All tiers |
| Non-profit | 25% off | Verified 501(c)(3) |
| New inspector | 20% off first year | < 1 year in business |

### Referral Program

- Referrer: $50 credit per successful referral
- Referee: 1 month free on any paid plan
- Paid out after referee completes 2 months

---

## Revenue Projections

### Assumptions

- Year 1: 200 paying customers (after trial conversion)
- Trial-to-paid conversion rate: 25%
- Mix: 50% Pro, 35% Team, 15% Business
- Average additional seats on Team/Business: 2
- Annual billing adoption: 40%

### Year 1 Monthly Recurring Revenue

| Tier | Customers | Avg MRR | Total MRR |
|------|-----------|---------|-----------|
| Pro | 100 | $79 | $7,900 |
| Team | 70 | $217 | $15,190 |
| Business | 30 | $354 | $10,620 |
| **Total** | **200** | | **$33,710** |

**Annual Recurring Revenue (ARR): ~$404,520**

### Trial Funnel (Year 1)

| Stage | Count | Rate |
|-------|-------|------|
| Signups | 800 | - |
| Complete onboarding | 600 | 75% |
| Create first inspection | 480 | 80% |
| Reach day 30 | 400 | 83% |
| Convert to paid | 200 | 50% of active |

---

## Pricing FAQ

**Q: Is there a free trial?**
A: Yes! All plans include a 30-day free trial with full features. No credit card required to start.

**Q: What happens when my trial ends?**
A: You'll be prompted to choose a plan. If you don't subscribe within 7 days, your account is paused. Data is preserved for 30 days, then deleted.

**Q: Can I switch plans anytime?**
A: Yes. Upgrades are immediate and prorated. Downgrades take effect at the next billing cycle.

**Q: Do you charge per report?**
A: No. All paid plans include unlimited reports.

**Q: Is there a contract?**
A: No long-term contracts. Monthly plans can be canceled anytime. Annual plans are paid upfront.

**Q: Can I add inspectors mid-cycle?**
A: Yes. Additional seats are prorated for the remainder of your billing period.

**Q: Do you take a cut of my inspection fees?**
A: No. We charge 0% platform fee. You only pay Stripe's standard processing fees (2.9% + $0.30).

**Q: What's the early adopter discount?**
A: 50% off your first 3 months. If you commit to annual billing, you get an additional month free (3 months free total).
