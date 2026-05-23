# Maven — Config TODO (self-reminders)

This file is the **source-of-truth list** of config artifacts Maven expects but hasn't received yet. At startup Maven reads this file; if any item is still marked `pending`, she:

1. Logs a warning to stdout.
2. Appends a one-line item to her daily digest in Telegram.
3. For `blocking_for_*` items, refuses to run the dependent operation rather than silently degrading.

Clear an item by setting `status: provided` and writing the actual artifact at the listed path.

## Items

```yaml
- id: honey_ledger_capabilities
  status: pending
  required_for: any draft that mentions Honey Ledger features
  artifact_path: /agents/maven/config/honey_ledger_capabilities.md
  default_behavior_until_provided: |
    use the placeholder CAN/CANNOT list in TOOLS.md.
    Drafter will append "(capabilities list pending — verify before publishing)" to the variant_note of any Honey Ledger draft.
  reminder_cadence: weekly

- id: voice_profile_danny
  status: pending
  required_for: drafts where voice == 'danny'
  artifact_path: /agents/maven/config/voice/danny.md
  default_behavior_until_provided: use the inline description in PROFILE.md
  reminder_cadence: weekly

- id: voice_profile_miriam
  status: pending
  required_for: drafts where voice == 'miriam'
  artifact_path: /agents/maven/config/voice/miriam.md
  default_behavior_until_provided: |
    use the inline description in PROFILE.md.
    Every miriam-voiced draft includes a sticky banner: "Voice profile not yet ratified by Miriam — confirm tone before publishing."
  reminder_cadence: blocking_for_miriam_voice
  approval_required_by: miriam

- id: voice_profile_apis_brand
  status: pending
  required_for: drafts where voice == 'apis_brand'
  artifact_path: /agents/maven/config/voice/apis.md
  default_behavior_until_provided: use the inline description in PROFILE.md
  reminder_cadence: weekly

- id: prohibited_phrases_extended
  status: pending
  required_for: any draft
  artifact_path: /agents/maven/config/prohibited_phrases.json
  default_behavior_until_provided: use the hard-coded list in SECURITY.md
  reminder_cadence: monthly

- id: pillars_config
  status: pending
  required_for: idea generator + calendar planner
  artifact_path: /agents/maven/config/pillars.json
  default_behavior_until_provided: use the 5 pillars in SPEC.md
  reminder_cadence: monthly
```

## How Maven uses this

```ts
// pseudocode
const todo = loadConfigTodo();
const pendingBlocking = todo.filter(i => i.status === 'pending' && i.reminder_cadence.startsWith('blocking'));
if (pendingBlocking.length) {
  warn(`Maven has ${pendingBlocking.length} blocking config items. See CONFIG_TODO.md.`);
}
appendToDigest(buildPendingConfigSummary(todo));
```

In Telegram, `/configtodo` returns the current list with their statuses and impact.
