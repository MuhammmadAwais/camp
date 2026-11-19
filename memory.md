# Memory — Vercel Production Mock Authentication & Vercel MCP Tooling Verification

Last updated: 2026-11-19 17:32:00

## What was built

1. **Authentication Credentials & Mock Auth Discovery:**
   - Identified and verified mock credentials for Seller (`seller@autonexa.ca`), Dealer Admin (`dealer@autonexa.ca`), Dealer Agent (`agent@autonexa.ca`), and Admin (`admin@autonexa.ca`), all with default demo password `password123`.
   - Verified mock OTP bypass code (`000000`) for Canadian multi-factor phone/email verification steps.

2. **Vercel Remote MCP Server Setup:**
   - Connected and validated the Vercel MCP server configuration (`https://mcp.vercel.com`) within `~/.gemini/config/mcp_config.json`.
   - Successfully inspected live Vercel project metadata (`prj_3hObIfo1ETFb04iML5wu0sAxm9Dc`), deployments, project domains, and environment settings using MCP tools (`list_projects`, `list_deployments`, `filter_project_envs`, `get_deployment`).

## Decisions made

- **Production Mock API Flag:** Enabled `ENABLE_MOCK_API=true` on Vercel environment variables so that demo accounts can log in on the live staging/production URL (`camp-amber.vercel.app`) without requiring a live Express/database backend connection.

## Problems solved

- **404 "Not found" Error on Vercel Login:** Diagnosed that `lib/mock/http.ts` intentionally disables mock authentication in production (`NODE_ENV === "production"`) unless `ENABLE_MOCK_API=true` is set. Setting the variable and redeploying restored 200 OK responses with JWT token issuance on `https://camp-amber.vercel.app/api/auth/login`.
- **Vercel MCP Connection:** Verified valid token authentication and active connection to the Vercel platform MCP server, allowing direct monitoring and configuration queries from the workspace.

## Current state

- **Live Deployment:** Production deployment `dpl_Eu9f4VW7qH2pNCumTRtj1w6BDmfJ` on `camp-amber.vercel.app` is `READY`.
- **Authentication:** Operational across all demo roles (Seller, Dealer, Admin) in both local development and live Vercel deployment.
- **Vercel MCP Server:** Fully functional and accessible for deployment inspection, logs, and project management.

## Next session starts with

- Proceed with testing or building the next planned portal workflows (e.g., Dealer auction bidding view, Seller inspection/appointment voucher flows, or Admin moderation).
- Verify end-to-end user journeys using the active mock accounts on the live deployment.

## Open questions

- None. Mock authentication and Vercel MCP integrations are functioning as expected.
