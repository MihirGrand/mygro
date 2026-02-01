# MygroAgent Platform API Documentation v2

> **Migration Notice**: This documentation covers the v2 API endpoints for the headless e-commerce platform. Merchants migrating from the hosted platform (v1) should review the breaking changes section carefully.

---

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Webhooks](#webhooks)
4. [Error Codes](#error-codes)
5. [Migration Guide (v1 → v2)](#migration-guide)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Rate Limits](#rate-limits)
8. [Deprecation Notices](#deprecation-notices)

---

## Authentication

### API Key Types

| Key Type | Prefix | Environment | Usage |
|----------|--------|-------------|-------|
| Live Key | `sk_live_` | Production | Real transactions |
| Test Key | `sk_test_` | Sandbox | Testing only |
| Legacy Key | `api_` | **DEPRECATED** | v1 hosted platform only |

### Authentication Headers

```
Authorization: Bearer sk_live_xxxxxxxxxxxx
X-Merchant-ID: MERCH-001
X-API-Version: 2024-01-15
```

### Breaking Change from v1

**⚠️ CRITICAL**: Legacy API keys prefixed with `api_` are **no longer valid** in v2. All merchants must generate new keys from the dashboard.

**Common Error**: `AUTH_401 - Invalid API Token. Token does not match environment.`

**Solution**: Generate new v2 API keys from Dashboard → Settings → API Keys. Ensure you're using `sk_live_` for production and `sk_test_` for sandbox.

---

## API Endpoints

### Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.platform.com/v2` |
| Sandbox | `https://sandbox.api.platform.com/v2` |
| **DEPRECATED v1** | `https://api.platform.com/v1` |

### Products

#### List Products
```
GET /v2/products
```

**Parameters:**
- `limit` (integer, optional): Max 100, default 20
- `cursor` (string, optional): Pagination cursor
- `status` (string, optional): `active`, `draft`, `archived`

**v1 → v2 Changes:**
- Endpoint changed from `GET /v1/products/list` to `GET /v2/products`
- Response format changed: `items` array renamed to `data`
- Pagination changed from offset to cursor-based

#### Create Product
```
POST /v2/products/create
```

**Required Fields:**
- `name` (string)
- `price` (integer, in cents)
- `currency` (string, ISO 4217)

**v1 → v2 Changes:**
- Price must now be in **cents** (v1 accepted decimal dollars)
- `sku` field is now required for inventory sync

---

### Checkout

#### Create Checkout Session
```
POST /v2/checkout/create
```

**Required Fields:**
- `line_items` (array)
- `success_url` (string)
- `cancel_url` (string)

**v1 → v2 Changes:**
- Field renamed: `items` → `line_items`
- Field renamed: `redirect_url` → `success_url`
- New required field: `cancel_url`

#### Capture Payment
```
POST /v2/checkout/capture
```

**⚠️ DEPRECATED**: In v1, payment capture was automatic. In v2, you must explicitly capture authorized payments within 7 days.

---

### Orders

#### Bulk Order Operations
```
POST /v2/orders/bulk
```

**Rate Limit**: 100 requests per minute per merchant

**v1 → v2 Changes:**
- Rate limit reduced from 500 to 100 requests/minute
- Batch size limited to 50 orders per request

---

### Inventory

#### Sync Inventory
```
GET /v2/inventory/sync
```

**Timeout**: 5000ms (reduced from 30000ms in v1)

**v1 → v2 Changes:**
- Default timeout reduced to 5 seconds
- Large catalogs must use pagination
- Webhook-based sync recommended for 10k+ SKUs

---

### Payments

#### Process Payment
```
POST /v2/payments/process
```

**SSL Requirements:**
- TLS 1.2 or higher required
- Certificate must be valid and not expired
- Self-signed certificates not accepted

---

## Webhooks

### Webhook Configuration

Webhooks must be configured in Dashboard → Settings → Webhooks.

**Required URL format**: `https://` (HTTP not allowed in v2)

### Webhook Events

| Event | Description |
|-------|-------------|
| `order.created` | New order placed |
| `order.paid` | Payment confirmed |
| `order.fulfilled` | Order shipped |
| `checkout.completed` | Checkout session finished |
| `inventory.low` | Stock below threshold |

### Webhook Payload Format

```json
{
  "id": "evt_xxxxx",
  "type": "order.created",
  "created": 1698415200,
  "data": {
    "object": { ... }
  }
}
```

### Webhook Signature Verification

All webhooks include `X-Webhook-Signature` header. **Verification is required in v2.**

```
signature = HMAC-SHA256(webhook_secret, payload_body)
```

### Common Webhook Issues

**WEBHOOK_FAIL - Delivery Failed**

Causes:
1. Endpoint returns non-2xx status
2. Endpoint timeout (>5 seconds)
3. Invalid SSL certificate
4. Endpoint not reachable

**Solution**: Ensure your webhook endpoint:
- Returns 200 status within 5 seconds
- Has valid SSL certificate
- Is publicly accessible
- Handles POST requests with JSON body

---

## Error Codes

### Authentication Errors

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `AUTH_401` | 401 | Invalid API token | Generate new v2 API key |
| `AUTH_403` | 403 | Insufficient permissions | Check API key scopes |
| `AUTH_EXPIRED` | 401 | Token expired | Regenerate API key |

### Request Errors

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `PARSE_400` | 400 | Invalid JSON payload | Validate JSON syntax |
| `VALIDATION_400` | 400 | Missing required field | Check required fields |
| `RATE_429` | 429 | Rate limit exceeded | Implement backoff |

### Server Errors

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `TIMEOUT_504` | 504 | Request timeout | Reduce payload size, use pagination |
| `DB_500` | 500 | Database error | Retry with exponential backoff |
| `SSL_ERR` | 495 | SSL certificate error | Update SSL certificate |

### CORS Errors

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `CORS_403` | 403 | Origin not allowed | Add domain to allowed origins in Dashboard |

**Allowed Origins Configuration:**
Dashboard → Settings → API → Allowed Origins

---

## Migration Guide

### Phase 1: Authentication (Critical)

1. Generate new v2 API keys from Dashboard
2. Update all API key references in your codebase
3. Remove any `api_` prefixed legacy keys

### Phase 2: Endpoint Updates

| v1 Endpoint | v2 Endpoint | Notes |
|-------------|-------------|-------|
| `GET /v1/products/list` | `GET /v2/products` | Response format changed |
| `POST /v1/checkout` | `POST /v2/checkout/create` | New required fields |
| `POST /v1/order` | `POST /v2/orders` | Price format changed |
| `GET /v1/inventory` | `GET /v2/inventory/sync` | Timeout reduced |

### Phase 3: Webhook Migration

1. Update webhook URLs to HTTPS
2. Implement signature verification
3. Update payload parsing for new format

### Phase 4: Frontend Updates

1. Update checkout redirect handling
2. Implement new error code handling
3. Update CORS configuration

---

## Common Issues & Solutions

### Issue: "AUTH_401 - Invalid API Token"

**Root Cause**: Using v1 legacy API key with v2 endpoints.

**Solution**:
1. Go to Dashboard → Settings → API Keys
2. Generate new v2 key (starts with `sk_live_` or `sk_test_`)
3. Update your environment variables
4. Redeploy your application

**Agent Action**: Can auto-rotate API keys for merchant if approved.

---

### Issue: "CORS_403 - Origin not allowed"

**Root Cause**: Frontend domain not in allowed origins list.

**Solution**:
1. Go to Dashboard → Settings → API → Allowed Origins
2. Add your frontend domain (e.g., `https://shop.merchant.com`)
3. Changes take effect within 5 minutes

**Note**: Localhost origins (`http://localhost:*`) only work with test keys.

---

### Issue: "RATE_429 - Rate limit exceeded"

**Root Cause**: Exceeding 100 requests/minute limit (reduced from v1's 500).

**Solution**:
1. Implement request queuing
2. Use batch endpoints where available
3. Cache frequently accessed data
4. Implement exponential backoff

**Agent Action**: Can temporarily increase rate limit with engineering approval.

---

### Issue: "WEBHOOK_FAIL - Delivery failed"

**Root Cause**: Webhook endpoint unreachable or returning errors.

**Diagnostic Steps**:
1. Verify endpoint URL is correct and uses HTTPS
2. Check SSL certificate is valid
3. Ensure endpoint responds within 5 seconds
4. Verify endpoint returns 2xx status

**Agent Action**: Can resend failed webhooks and provide delivery logs.

---

### Issue: "TIMEOUT_504 - Request timeout"

**Root Cause**: Request exceeds 5-second timeout (reduced from 30s in v1).

**Solution**:
1. Use pagination for large data sets
2. Reduce payload size
3. Switch to webhook-based async processing
4. Optimize database queries on your end

---

### Issue: "PARSE_400 - Invalid JSON payload"

**Root Cause**: Malformed JSON in request body.

**Common Causes**:
- Unescaped special characters
- Trailing commas
- Single quotes instead of double quotes
- Missing closing brackets

**Solution**: Validate JSON before sending. Use `JSON.stringify()` for objects.

---

### Issue: "SSL_ERR - Certificate error"

**Root Cause**: Invalid, expired, or self-signed SSL certificate.

**Solution**:
1. Renew SSL certificate if expired
2. Use certificate from trusted CA
3. Ensure full certificate chain is installed
4. Verify certificate matches domain

---

## Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 | per minute |
| Read operations | 1000 | per minute |
| Write operations | 100 | per minute |
| Bulk operations | 10 | per minute |
| Webhooks (retries) | 5 | per event |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698415260
```

---

## Deprecation Notices

### Deprecated in v2 (Remove by 2024-06-01)

| Feature | Replacement |
|---------|-------------|
| `api_` prefix keys | `sk_live_` / `sk_test_` keys |
| `/v1/*` endpoints | `/v2/*` endpoints |
| HTTP webhooks | HTTPS webhooks only |
| Offset pagination | Cursor pagination |
| Auto-capture payments | Explicit capture required |

### Sunset Schedule

| Date | Action |
|------|--------|
| 2024-03-01 | v1 endpoints return deprecation warnings |
| 2024-04-01 | v1 rate limits reduced by 50% |
| 2024-05-01 | v1 endpoints read-only |
| 2024-06-01 | v1 endpoints disabled |

---



