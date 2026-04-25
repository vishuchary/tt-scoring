# tt-scoring Project Instructions

## Deployment Defaults

Always use the following accounts for all deployments and pushes:

1. **GitHub**: `vishuchary` — remote `https://github.com/vishuchary/tt-scoring.git`
2. **Vercel**: `vishuchary` / `vishucharys-projects` — run `vercel whoami` before deploying; if not `vishuchary`, run `vercel logout` then `vercel login`
3. **Firebase**: `vishuchary` account
4. **Domain**: Cloudflare-managed domain (`hublabs.us`, `mhttclub.com`, etc.)

When deploying:
- Build from `app/` directory
- Deploy with `vercel --prod --yes` from `app/`
- Alias production to `dev.mhttclub.hublabs.us`
