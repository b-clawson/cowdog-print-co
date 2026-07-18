# Admin Calculator Upgrade - Phase 1

## 🎯 Goal
Make the admin calculator faster, smarter, and more useful for daily quoting.

---

## ✅ Phase 1 Features (Adding Now)

### 1. **Profit Margin Tracker** 
**What it does:**
- Shows your actual cost vs. customer price
- Real-time profit calculation per item
- Color-coded margin indicators:
  - 🟢 Green: >25% margin (healthy)
  - 🟡 Yellow: 15-25% margin (okay)
  - 🔴 Red: <15% margin (too low)

**Where it shows:**
- On each item card in the job list
- In the invoice total section
- Per-piece and total profit displayed

**Example:**
```
Customer Price: $1,438.00
Your Cost: $1,108.00
Profit: $330.00 (23% margin) 🟡
```

---

### 2. **Quick Templates**
**What it does:**
- One-click to load common job types
- Pre-fills all fields instantly
- Editable after loading

**Templates included:**
- 100 Black Tees, 1-Color Front
- 50 Hats, Front Embroidery
- 250 Hoodies, 3-Color Front
- 12 Sample Run, 2-Color
- Custom (save your own)

**Where it shows:**
- New "Quick Templates" dropdown at top
- Click → All fields auto-fill → Ready to quote

---

### 3. **Duplicate Item Button**
**What it does:**
- Clone any item with one click
- Perfect for variations (different colors, sizes)
- Maintains all settings, just edit what's different

**Where it shows:**
- Small "Duplicate" button on each item card
- Copies to calculator for editing

**Use case:**
Customer wants same design on black AND white tees → 
Duplicate → Change garment color → Done

---

### 4. **Email Export**
**What it does:**
- Generates professional quote text
- Copy to clipboard with one click
- Paste directly into email

**Format:**
```
QUOTE #[auto-number]
Date: July 18, 2026

ITEMS:
• 100 Black Tees - 2 colors, front only
  $12.50/pc = $1,250.00

• 50 Hats - Front embroidery
  $15.00/pc = $750.00

FINISHING:
• Fold & Poly (Tees): $110.00

TOTAL: $2,110.00

---
Quote valid for 30 days
Turnaround: 2-3 weeks from artwork approval
50% deposit required to begin production
```

**Where it shows:**
- "Copy Quote" button in invoice section
- Click → Copied → Paste into email

---

### 5. **Cost Breakdown Toggle**
**What it does:**
- Show/hide your internal costs
- Helps you understand profitability per job
- Not visible to customers (internal only)

**What it shows:**
```
CUSTOMER VIEW:
Total: $1,438.00

YOUR COST VIEW (toggle on):
Blanks: $608.00
Printing labor: $280.00
Materials (ink, screens): $220.00
Total Cost: $1,108.00
Profit: $330.00 (23%)
```

---

### 6. **Job Notes**
**What it does:**
- Add internal notes to each quote
- Remember special requests
- Track artwork status

**Examples:**
- "Artwork needs revision - text too small"
- "Customer wants sample before full run"
- "Rush for event on Aug 15"

**Where it shows:**
- Note field on each item
- Appears in saved quotes
- Shows in email export (optional)

---

### 7. **Recent Quotes Panel**
**What it does:**
- Shows last 10 quotes
- One-click to reload
- Track what you've quoted recently

**Where it shows:**
- Sidebar or dropdown at top
- Shows: Customer, date, total, status

**Example:**
```
Recent Quotes:
• Dead Set - $2,450 - Jul 17 (Sent)
• August Apparel - $1,850 - Jul 15 (Approved)
• New Customer - $780 - Jul 14 (Pending)
```

---

### 8. **Quick Actions**
**What it does:**
- Common shortcuts for speed
- Keyboard shortcuts (optional)
- Batch operations

**Actions:**
- Clear all items
- Duplicate entire job
- Apply 20% markup to all
- Toggle between cost/price view
- Export to PDF (future)

---

## 📊 Impact Estimate

### Time Savings:
- **Before:** 10-15 mins per quote
- **After:** 5-8 mins per quote
- **Savings:** ~50% faster quoting

### Better Margins:
- Real-time profit visibility → better pricing decisions
- Catch low-margin jobs before quoting
- Target: +2-5% average margin increase

### Fewer Errors:
- Templates → fewer typos
- Duplicate → consistency across variations
- Cost tracking → catch pricing mistakes

---

## 🎨 UI Improvements

### Current Layout:
```
[Calculator] [Job Items] [Invoice]
```

### New Layout:
```
[Templates ▼] [Recent Quotes ▼]
[Calculator] [Job Items (w/ profit)] [Invoice (w/ cost view)]
[Copy Quote] [Save Customer] [Export]
```

---

## 💾 Data Storage

**Where quotes are saved:**
- Browser localStorage (no server needed)
- Persists across sessions
- ~5MB storage = 100+ saved quotes

**What's saved:**
- Customer name (optional)
- All items with details
- Date created
- Total & profit
- Status (draft, sent, approved)

---

## 🚀 Next Steps After Phase 1

### Phase 2: Customer Tracking (Future)
- Customer database
- Quote history per customer
- "Repeat last order" button
- Search/filter quotes

### Phase 3: Advanced (Future)
- Google Sheets integration
- PDF generation
- Email sending (direct from calculator)
- Analytics dashboard

---

## ⚙️ Technical Details

**No backend needed:**
- Pure JavaScript
- localStorage for persistence
- Works offline
- No login required (password-protected)

**Browser support:**
- Chrome, Firefox, Safari, Edge
- Mobile responsive
- Works on iPad/tablet

---

## 🎯 Success Metrics

After 2 weeks of use, you should see:
- ✅ Faster quoting (50% time reduction)
- ✅ Better margins (catch low-profit jobs)
- ✅ Fewer email back-and-forth (professional quotes)
- ✅ More consistent pricing (templates)
- ✅ Less mental overhead (saved quotes)

---

Ready to build this! Shall I proceed with implementation?
