Kobo Dashboard Design Language v1.0
Design Philosophy

Kobo should feel like a modern financial command center rather than a reporting application. The dashboard should immediately answer a user's most important financial questions without overwhelming them with data.

The design should communicate:

clarity over complexity
confidence over decoration
financial control
premium quality
speed
simplicity

The dashboard should encourage scanning rather than reading.

Every element should have a clear purpose.

If a widget does not help users make a financial decision within a few seconds, it should be moved to another page.

Visual Personality

Keywords

Premium
Professional
Modern
Minimal
Data-first
Spacious
Calm
Confident

Avoid

Dashboard clutter
Large walls of information
Equal visual weight everywhere
Excessive gradients
Multiple competing focal points
Information Hierarchy

The dashboard should answer these questions in this exact order.

How much money do I currently have?
Am I saving money or losing money?
How is my cash flowing?
Are any budgets or goals at risk?
What happened recently?

Everything else becomes secondary.

Overall Layout

Desktop

──────────────────────────────────────────────

Dashboard Header

──────────────────────────────────────────────

Primary Financial Overview

(Large Hero Section)

──────────────────────────────────────────────

Quick Financial Metrics

(4 Cards)

──────────────────────────────────────────────

Cash Flow Analysis

(Large)

Budget Status

(Medium)

──────────────────────────────────────────────

Savings Progress

Recent Activity

──────────────────────────────────────────────

Insights

Upcoming Alerts

──────────────────────────────────────────────

Instead of stacking everything vertically, information should be grouped into clear zones.

Hero Section

The largest component on the page.

Purpose

Give users an immediate understanding of their finances.

Contains

Total Net Worth / Total Balance
Monthly Change
Current Month Income
Current Month Expenses
Current Savings
Small sparkline
Quick Actions

This should occupy roughly 35–40% of the first viewport.

Summary Cards

Reduce from five equally weighted cards to four supporting cards.

Recommended cards

Income

Expenses

Savings

Available Cash

These cards should support the Hero Card instead of competing with it.

Grid System

Desktop

12-column grid

Spacing between columns

24px

Spacing between sections

40px

Internal card padding

24px

Maximum content width

Approximately 1440px

Do not stretch components across ultra-wide monitors.

Card Design

Large border radius

16px

Soft shadow

Very subtle elevation

Thin borders

No heavy outlines

Cards should feel lightweight.

Colour Language

Primary Accent

Emerald Green

Used for

Positive financial actions

Primary buttons

Income

Growth

Secondary Accent

Blue

Used for

Information

Accounts

Wallets

Neutral

Grey surfaces

Avoid large pure black backgrounds.

Dark mode should use layered surfaces instead.

Warning

Amber

Critical

Red

Savings

Purple

Budgets

Orange

Typography

Display Font

Plus Jakarta Sans

Body

Inter

Hierarchy

Dashboard Title

32px

Hero Value

40–48px

Card Values

26–30px

Section Titles

20px

Body

15–16px

Captions

12–13px

Numbers should always use tabular figures.

Whitespace

Whitespace is considered an active design element.

Increase spacing between major sections.

Avoid placing charts directly against each other.

Cards should breathe.

Charts

One chart should dominate.

The remaining charts become supporting widgets.

Recommended emphasis

Large Cash Flow Chart

Medium Budget Progress

Medium Spending Categories

Small Savings Trend

Avoid placing multiple equally large charts beside each other.

Dashboard Priority

Highest

Hero Financial Summary

High

Cash Flow

Medium

Budget Overview

Savings

Accounts

Lower

Recent Transactions

Insights

Notifications

The first screen should not require scrolling to understand financial health.

Widget Philosophy

Every widget should answer one question.

Examples

Balance

"How much money do I have?"

Income

"How much did I earn?"

Budget

"Am I overspending?"

Savings

"Am I reaching my goals?"

Transactions

"What changed recently?"

Never mix multiple questions inside one widget.

Motion

Animations should communicate change.

Not decoration.

Recommended

200–300ms

Smooth easing

Counters animate

Charts fade

Cards lift 2–4px

Progress bars animate once

Avoid excessive movement.

Dark Mode

Dark backgrounds should use layered greys instead of pure black.

Cards should be slightly brighter than the page background.

Borders should remain subtle.

Primary colour remains emerald.

Light Mode

Warm white backgrounds.

Very light grey surfaces.

Subtle shadows.

Strong contrast for important numbers.

Accessibility

Minimum touch target

44px

Minimum contrast

WCAG AA

Charts should not rely only on colour.

Icons should always accompany colour-coded metrics.

Responsive Behaviour

Desktop

Full dashboard

Tablet

Two-column layout

Mobile

Single-column layout

Hero section remains first.

Summary cards become two per row.

Charts stack vertically.

Recent transactions become simplified cards instead of a wide table.