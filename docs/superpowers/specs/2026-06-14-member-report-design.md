# Member Report Design

## Summary

Add a member-specific report to the guild members page. The report shows what missions a selected member completed and what shop items they purchased for the current week, current month, and current year.

This feature reuses existing Firestore logs instead of creating new report documents. Reports are calculated on demand from `mission_logs` and `usage_logs`.

## Approved Scope

- Include mission completion activity.
- Include shop item purchase activity.
- Exclude attendance, grade challenge, gold transfer, character creation, and other activity types.
- Use current calendar periods:
  - Weekly: Monday through Sunday for the week containing today.
  - Monthly: first through last day of the current month.
  - Yearly: January 1 through December 31 of the current year.
- Open the report from a `Report` action on each member card.
- Show the report in a modal on the members page.
- Show summary cards and detailed lists for each period.

## User Flow

Each character card on `/guilds/[guildId]/members` gets a report action. Selecting it opens `MemberReportModal` for that character.

The modal contains:

- A header with the member name and active period label.
- Period tabs for weekly, monthly, and yearly views.
- Four summary cards:
  - Mission count.
  - Mission gold earned.
  - Purchase count.
  - Purchase gold spent.
- A mission detail list.
- A purchase detail list.

On desktop, the mission and purchase lists can sit side by side. On mobile, they stack in one column. If a period has no matching records, the summary cards show `0` and the relevant list shows an empty state.

## Data Sources

The report uses existing subcollections under `guilds/{guildId}`:

- `mission_logs`
- `usage_logs`

Mission logs are included when `performerCharacterIds` contains the selected character ID. Logs with `missionId === "ATTENDANCE"` are excluded because attendance is out of scope even though it is stored in `mission_logs`.

Usage logs are included when `characterId` equals the selected character ID.

## Mission Gold Calculation

For solo missions, the selected member's earned gold is the mission log reward amount.

For party missions, `mission_logs.totalReward` is split across the number of performers:

```ts
memberReward = totalReward / performerCharacterIds.length
```

This matches the current mission completion behavior, where each participant receives the same reward. If a historical log is missing `performerCharacterIds` or has an empty performer list, the report treats the member reward as `0` rather than guessing.

## Architecture

Add a focused report module instead of expanding the existing guild-wide log timeline.

Planned units:

- `src/lib/features/members/report.ts`
  - Period boundary helpers.
  - Mission and purchase filtering.
  - Summary aggregation.
  - Formatting-independent report types.
- `src/lib/stores/memberReportStore.ts`
  - Fetch mission and usage logs for a guild/member.
  - Expose loading, error, and report data state.
- `src/lib/components/MemberReportModal.svelte`
  - Own the modal UI and period tab state.
  - Render summary cards and detail lists.
- `src/routes/guilds/[guildId]/members/+page.svelte`
  - Add the report action to each character card.
  - Track the selected character for the report modal.

The members page should only wire the selected character to the modal. Report calculation should stay outside the page so it can be tested directly.

## Firestore Query Strategy

Start with simple reads that avoid new composite indexes:

- Read `mission_logs` for the guild and filter client-side by member and period.
- Read `usage_logs` for the guild and filter client-side by member and period.

This matches the existing `logStore` approach and is acceptable for the current app shape. If report data becomes large, a later optimization can add Firestore queries such as `where("characterId", "==", memberId)` for purchases or denormalized member-specific report summaries.

## Loading, Error, And Empty States

The modal should distinguish:

- Loading: report data is being fetched.
- Error: Firestore read failed or the current user lacks permission.
- Empty period: data loaded successfully, but there are no matching missions or purchases.

Errors should use the app's existing notification and error wording style where practical. Empty states should stay inside the relevant report section instead of closing the modal.

## Testing

Add focused tests for the report aggregation helpers:

- Weekly period starts on Monday and ends on Sunday.
- Monthly period covers the current month.
- Yearly period covers the current year.
- Mission aggregation excludes attendance logs.
- Mission aggregation excludes logs outside the selected period.
- Party mission rewards are divided by performer count.
- Purchase aggregation filters by selected member ID.
- Purchase aggregation excludes logs outside the selected period.
- Summary totals match the filtered detail rows.

Run `npm run check` after implementation to verify Svelte and TypeScript wiring.

## Out Of Scope

- Exporting reports to PDF or CSV.
- Custom date ranges.
- Historical week/month/year navigation.
- Grade challenge reporting.
- Attendance reporting.
- Gold transfer reporting.
- New Firestore report documents or scheduled report generation.
