# Admin V3 implementation checkpoint — 2026-10-31

Branch: feat/admin-v3-safe-workspace. This is an incremental implementation,
not a completed V3 acceptance or a production release.

## Implemented

- Dedicated authenticated overview, products, edit/new, categories, factory,
  cases, media, shipping, blog, inquiries, health and settings routes.
- /admin redirects to /admin/dashboard; tracking/backups remain available.
- Shared dark-green navigation, responsive drawer, Chinese-first shell and
  product forms, English language preference (does not translate stored content).
- Product pagination (20), search, brand/category/status filters, updated sorting,
  standalone edit tabs, explicit draft/publish, cover selection and manual image
  reordering, parameter-text preview with confirmation.
- Uploads no longer publish from content-editor callbacks.
- Fixed upload response: only newly uploaded assets are returned, rather than
  the entire existing media library.
- Tracking uses the existing HttpOnly session and structured milestone inputs.
- Legacy product component delegates to the unified manager; no sessionStorage
  password persistence. Existing browser-stored passwords are removed.
- Admin product/collection reads fail visibly on database errors instead of
  silently presenting fallback/empty records. Public read behavior is unchanged.
- Inquiry follow-up preserves original customer fields.
- Media deletion checks references in the principal CMS collections and base media.
- Existing IDs, JSON data, images, schema and production rows were not migrated,
  rewritten or deleted by this task.

## Blocked acceptance

Read-only products:audit still returns Neon HTTP 402 quota exceeded. Database
count is UNKNOWN, not zero. The Git seed has 40 products; that is not evidence
of the production database count. No production CRUD/backup/restore test has been
performed. Resolve database quota/access before attempting those tests.

Do not merge or deploy this branch as a completed V3 until blocked and pending
acceptance items have been addressed.

## Remaining work

- Complete translation of legacy content, backup, login, and tracking messages.
- True five-step new-product wizard and unpublished preview.
- Batch actions with backup/confirmation, product duplication, thumbnail service.
- Drag-and-drop upload/order, byte progress and shared existing-media picker.
- Full media grid/list, category/search UX and exhaustive reference graph.
- Full homepage composition editor (hero, module ordering, draft publication);
  /admin/home currently manages existing shipment slots only.
- Full CRM filters/WhatsApp actions; dedicated factory/case editors.
- Route-transition dirty prompts across every navigation path; current forms
  protect browser unload and their own cancel/back actions.
- Remaining product-store transactional and migration concerns documented in
  the prior recovery task are not fixed by this UI change.
- Real DB count parity, create/edit/upload/draft/publish/trash/restore/backup tests.
- Comprehensive public site and mobile browser regression testing.

## Local verification

Use npm run typecheck, npm run lint, npm run build, npm run test:products.
For an isolated browser fixture test, run a local server at port 3012, then:

    node --env-file-if-exists=.env --env-file-if-exists=.env.local scripts/test-admin-v3.mjs

The browser test intercepts product writes with in-memory fixtures, verifies
pagination/search/language/mobile width and preservation of SEO/specifications.
It is not a substitute for production database acceptance.
