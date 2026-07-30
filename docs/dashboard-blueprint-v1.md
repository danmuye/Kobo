Kobo Dashboard Blueprint v1
Objective

Transform the Dashboard from an analytics page into a modern financial command center.

The redesign must preserve every existing calculation, Firebase synchronization, offline capability, Zustand store, and business logic.

Only the presentation, hierarchy, layout and user experience should change.

No financial functionality should be removed.

First Viewport

The first viewport should immediately answer the four questions every user has.

How much money do I have?

↓

Am I financially healthy?

↓

What changed this month?

↓

Should I worry about anything?

Nothing else should compete for attention.

New Desktop Layout
────────────────────────────────────────────

Dashboard Header

────────────────────────────────────────────

Hero Financial Overview

────────────────────────────────────────────

Income
Expenses
Savings
Budget Health

────────────────────────────────────────────

Cash Flow Chart

Financial Snapshot

────────────────────────────────────────────

Recent Transactions

Goals Progress

────────────────────────────────────────────

Budget Overview

Financial Insights

────────────────────────────────────────────

Instead of stacking unrelated sections vertically, every section becomes a dashboard widget.

Section 1 — Hero Financial Overview

This replaces the current five equal-weight Stat Cards.

Instead of five competing cards, create one dominant financial overview.

Occupies approximately 65% of the first row.

Contains:

Total Balance

Largest number on page.

Monthly Change

Percentage

Trend arrow

Previous month comparison

Available Balance

Secondary metric.

Quick Financial Summary

Income

Expenses

Savings

Displayed horizontally underneath.

Mini Sparkline

Last 30 days.

The remaining space contains Quick Actions.

+ Transaction

Transfer

Budget

Goal

Large icon buttons.

Not dropdowns.

Section 2 — Financial KPI Cards

Instead of

Balance

Income

Expenses

Cash Saved

Total Saved

Use only

Income

Current month

Monthly comparison

Trend

Expenses

Current month

Monthly comparison

Trend

Savings

Current month

Goal progress

Budget Health

One compact card

Instead of

Budget 1

Budget 2

Budget 3

...

Show

Healthy Budgets

Near Limit

Over Budget

with small progress indicator.

This immediately tells users if action is needed.

Section 3 — Cash Flow

This becomes the largest chart.

Width

Two-thirds.

Height

340–380px.

Use smooth area chart.

Large tooltip.

Soft grid lines.

Minimal labels.

Section 4 — Financial Snapshot

Occupies one-third beside Cash Flow.

Contains compact widgets.

Examples

Net Worth

Savings Rate

Debt Ratio

Budget Utilization

Each displayed as miniature statistic rows.

This section replaces the current oversized Budget Health card.

Section 5 — Recent Transactions

Current transaction table is too large for a dashboard.

Instead

Show only

Latest 5

Description

Category

Amount

Time


Small card.

Scrollable.

View All button.

Filtering belongs on Transactions page.

Not Dashboard.

Section 6 — Savings Goals

Instead of full GoalCards.

Use compact cards.

Each displays

Goal Name

Progress Ring

Saved

Remaining

Target Date

Only top three goals.

View All button.

Section 7 — Budget Overview

Replace current large Budget Cards.

Each budget becomes a compact horizontal card.

Contains

Budget Name

Progress

Remaining

Status

Mini trend

Maximum

4 visible.

Section 8 — Financial Insights

Small recommendation widget.

Examples

Food spending increased 12%

Savings exceeded target

Budget almost exceeded

Debt payment due

Largest expense this week

Uses your existing analytics.

No AI.

Just calculated insights.

Remove

Remove these from Dashboard.

Not from the application.

❌ Large Goal Cards

❌ Large Budget Cards

❌ Budget Details

❌ Budget Forecast Panel

❌ Budget Insight Panel

❌ Transaction Search

❌ Transaction Sorting

❌ Transaction Filters

❌ Transaction Pagination

❌ Huge Budget Health section

These belong on their dedicated pages.

Visual Hierarchy

Priority

★★★★★

Hero Balance

Cash Flow

★★★★☆

Income

Expenses

Budget Health

★★★☆☆

Recent Transactions

Savings

Budget Overview

★★☆☆☆

Insights

Notifications

Quick Actions

Nothing else should compete with the Hero section.

Card Sizes

Hero

Extra Large

Financial KPIs

Small

Cash Flow

Large

Snapshot

Medium

Transactions

Medium

Goals

Medium

Budgets

Medium

Insights

Small

Cards should no longer all have identical height.

White Space

Increase vertical spacing.

Large breathing room.

Avoid stacked cards touching one another.

More negative space.

Premium feeling.

Animations

Keep Framer Motion.

Improve it.

Counters animate.

Progress bars animate.

Charts animate once.

Cards elevate 2px.

Avoid excessive movement.

Dashboard Density

Reduce information shown in the first viewport by approximately 35%.

Increase readability.

Increase scanning speed.

Reduce cognitive load.

Business Logic Constraints

Do NOT change

Firebase

Zustand

Offline Support

Transactions

Budget Engine

Savings Engine

Debt Engine

Notification System

Analytics Engine

Authentication

Localization

Settings

Only redesign the presentation layer.

Reusable Components

Create reusable widgets where possible.

Examples

FinancialHeroCard

KPIStatCard

QuickActionCard

CompactBudgetCard

CompactGoalCard

FinancialInsightCard

SnapshotMetric

DashboardSection

DashboardWidget

WidgetHeader


Do not duplicate existing business logic.

Performance

Do not introduce unnecessary renders.

Memoize dashboard widgets.

Reuse existing selectors.

Keep calculations centralized.

Avoid repeated filtering of transactions.

Success Criteria

The redesigned dashboard should allow a user to understand their financial health within 5–8 seconds of opening the app.

It should feel closer to a premium finance application than a reporting interface, with a clear visual hierarchy, restrained information density, and a strong focus on actionable financial insights rather than exhaustive data.