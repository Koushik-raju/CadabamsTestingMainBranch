## ADDED Requirements

### Requirement: Central SWR key registry
All SWR cache keys SHALL be defined as named factory functions in `lib/swr-keys.ts`. No hook or component SHALL define SWR keys as inline string literals or inline arrays.

#### Scenario: Key imported from registry
- **WHEN** a hook needs a SWR key for assessments
- **THEN** it imports `assessmentsKey` from `@/lib/swr-keys` and calls it, rather than writing `['assessments', ...]` inline

#### Scenario: All new hooks use registry keys
- **WHEN** a new hook is created during migration
- **THEN** its SWR key is added to `lib/swr-keys.ts` before the hook file is written

### Requirement: Key factories cover all SDK resources
`lib/swr-keys.ts` SHALL export a key factory for every resource fetched with SWR after migration: assessments, assessment-by-id, assigned-assessments, assessment-submissions, journeys, journey-detail, journey-enrollment, appointments, slots, slot-price, campuses, packages, package-by-id, documents, notifications, prescriptions, leaderboard, mindful-minutes, mindful-minute-detail, wellness-resources, wellness-resource-detail, videos, video-detail, self-journaling, self-journaling-entry, auth-me.

#### Scenario: Key factory exists for each resource
- **WHEN** a developer greps `lib/swr-keys.ts` for a resource name
- **THEN** they find a named export for that resource's key factory

### Requirement: Mutation revalidation uses registry keys
After a write operation, `mutate()` calls SHALL reference the same key factory from the registry, not a hardcoded string.

#### Scenario: Post-submit revalidation
- **WHEN** `submitAssessment` completes successfully in a hook
- **THEN** it calls `mutate(assessmentSubmissionsKey(leadId, assessmentId))` using the registry function, not `mutate(['assessment-submissions', leadId, assessmentId])`

### Requirement: Dead keys removed from registry
Any key factory in `lib/swr-keys.ts` whose resource no longer exists after migration (e.g. keys for Strapi-only resources replaced by backend-v2) SHALL be deleted from the registry.

#### Scenario: Strapi-specific keys removed
- **WHEN** migration is complete
- **THEN** `lib/swr-keys.ts` does not export keys that reference strapi-specific pagination patterns or legacy resource names
