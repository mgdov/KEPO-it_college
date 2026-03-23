# KEPO-it_college

## Backend configuration

Set API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://176.32.32.120:3011/api
NEXT_PUBLIC_MOCK_MODE=false
```

`NEXT_PUBLIC_API_URL` supports both formats:

- `http://host:port`
- `http://host:port/api`

The API client normalizes paths to avoid duplicated `/api` in requests.
