# 🧪 Testing Guide

## Frontend Testing

### Setup

Testing is configured with **Vitest** (fast, Vite-native test runner) and **React Testing Library**.

```bash
cd frontend
npm install
npm run test
```

### Available commands

```bash
npm run test              # Run tests once
npm run test:ui          # Interactive test UI (http://localhost:51204)
npm run test:coverage    # Generate coverage report
```

### Writing tests

Tests go in `src/test/` directory with `.test.tsx` or `.test.ts` extension.

**Example component test:**
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListingCard } from '@/components/listings/ListingCard'

describe('ListingCard', () => {
  it('displays listing information', () => {
    const listing = {
      id: '1',
      crop: 'Tomato',
      price_per_kg: 150,
      location: 'Lagos'
    }
    
    render(<ListingCard listing={listing} />)
    expect(screen.getByText('Tomato')).toBeInTheDocument()
    expect(screen.getByText('₦150/kg')).toBeInTheDocument()
  })
})
```

### Testing patterns

- **Component rendering** - Check if component displays correctly
- **User interactions** - Test clicks, form submissions
- **Conditional rendering** - Test visibility based on props/state
- **Error states** - Test error handling and fallbacks

**Key imports:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
```

### Mocking

Mocks are pre-configured in `src/test/setup.ts`:
- `window.matchMedia` - Media queries
- Supabase client (optional)

**Mock API responses:**
```typescript
import { vi } from 'vitest'

beforeEach(() => {
  vi.mock('@/lib/supabase', () => ({
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [] })
      })
    }
  }))
})
```

## Backend Testing

### Setup

Deno has built-in testing support. No extra setup needed.

```bash
cd backend
deno test --allow-net --allow-env
```

### Writing tests

Tests go in `supabase/functions/` with `.test.ts` extension or in a separate `tests/` directory.

**Example Edge Function test:**
```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts"

Deno.test("Paystack webhook validation", async () => {
  const payload = {
    reference: "test-ref-123",
    amount: 50000
  }
  
  const signature = "computed-hmac-sig"
  
  const isValid = verifyPaystackSignature(payload, signature, "test-key")
  assertEquals(isValid, true)
})
```

### Available commands

```bash
npm run test           # Run tests once
npm run test:watch    # Watch mode - re-run on file changes
npm run lint          # Lint with deno lint
```

### Testing patterns

- **Webhook validation** - Test HMAC signature verification
- **Request/response** - Mock HTTP calls
- **Database operations** - Mock Supabase client
- **Error handling** - Test error responses

**Example webhook test:**
```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts"

Deno.test("webhook signature validation fails on tampered data", () => {
  const payload = { amount: 50000 }
  const tamperedSig = "invalid-signature"
  const secret = "sk_test_secret"
  
  const result = verifyPaystackSignature(payload, tamperedSig, secret)
  assertEquals(result, false)
})
```

## Local testing workflow

### Quick test during development

**Frontend:**
```bash
cd frontend
npm run test:ui
# Opens interactive dashboard at http://localhost:51204
# Shows real-time test results as you code
```

**Backend:**
```bash
cd backend
npm run test:watch
# Re-runs tests automatically when you save files
```

### Full test suite before commit

```bash
# Root directory
npm run build    # Build both services
cd frontend && npm run test && npm run lint
cd ../backend && npm run test && npm run lint
```

### Coverage reports

```bash
cd frontend
npm run test:coverage
# Opens coverage report in coverage/index.html
```

## CI/CD Integration

Tests run automatically in GitHub Actions before building Docker images:

1. **Frontend tests** - `npm run lint` + `npm run test`
2. **Backend tests** - `deno test`
3. **Builds** - Only proceed if tests pass

See [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)

## Common testing issues

**Q: Tests fail with "module not found"**
- Ensure `vitest.config.ts` path aliases match `tsconfig.json`
- Run `npm install` to install test dependencies

**Q: React component tests fail**
- Wrap components with necessary providers (Router, Context)
- Use `waitFor` for async operations

**Q: Supabase client isn't mocked**
- Check `src/test/setup.ts` has the mocks you need
- Add custom mocks as needed

**Q: Deno tests timeout**
- Increase timeout: `Deno.test({ name: "...", fn: async () => {...}, sanitizeOps: false })`

## Resources

- [Vitest docs](https://vitest.dev)
- [React Testing Library docs](https://testing-library.com/react)
- [Deno testing docs](https://docs.deno.com/runtime/manual/basics/testing)
- [Testing best practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
