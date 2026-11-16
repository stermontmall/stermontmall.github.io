# PR #785 CI handoff (run #334, merge commit bb919c4 of head 4db9433)

Temporary progress log for the mobile-shell CI failure. Delete before merging PR #785.

## Findings
- Run #334 failed in step `04-mobile-shell` (python3 mobile-shell/shell.test.py): 174/175 checks passed, 1 failed.
- The Actions log itself could not be read from this session (no log access), so the failing check was inferred from the test code, not read from the log.
- Prime suspect: `SSR fallback cards remain visible while the live catalogue is loading`. The test held the catalogue response with `time.sleep(2)` inside a synchronous Playwright route handler. That blocks `goto()` until the response has already been served, so the shell can hydrate (and remove the SSR cards) before the assertion runs.
- `H.log_message = ...` was set on a `functools.partial`, not on the handler class, so the test HTTP server still printed an access line per request and buried the real FAIL lines under `tail -n 80`.

## Planned changes
1. shell.test.py: park the first `get_store_catalogue` route and release it after the SSR assertion; quiet the HTTP handler with a real subclass.
2. seo-pr-quality.yml: failure summary prints every FAIL/Error line (with line numbers) plus the last 80 lines.

## Status
- Not yet pushed or verified in CI. Next: push, then read the check runs on the new head commit and confirm 175/175.
