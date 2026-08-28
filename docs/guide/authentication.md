# Authentication

How people sign in, and how machines authenticate.

## User sign-in

| Method | Status |
| --- | --- |
| Email and password | SUPPORTED |
| Google OAuth | SUPPORTED |
| Microsoft / Entra OAuth | LIMITED — see below |
| SAML SSO, SCIM | NOT INCLUDED |

Sessions are handled by NextAuth and signed with `NEXTAUTH_SECRET`.

### Self-registration

Registration is enabled by default and can be switched off:

```
NEXT_PUBLIC_DISABLE_SIGNUP=true
```

Disable it on any instance you operate for yourself. An open registration form on a public
scheduling instance is both an attack foothold and a spam surface.

Note that this flag controls the ordinary registration path. Invitation-token flows are a
separate mechanism, and the interaction between them is tracked as an open finding
([#38](https://github.com/rubennati/cal.diy/issues/38)) — relevant if you rely on the flag
as a hard boundary rather than as a product setting.

### Microsoft / Entra

The Entra sign-in path accepts identities from any Microsoft tenant unless you restrict it
yourself. If you intend "our organisation's Microsoft accounts", that restriction is not
applied for you. Tracked as [#23](https://github.com/rubennati/cal.diy/issues/23).

## API keys

**Status: SUPPORTED.** Managed under **Settings → Developer → API keys**.

| Property | Behaviour |
| --- | --- |
| Format | `cal_` prefix followed by a random value |
| Storage | SHA-256 hash only; the plaintext key is shown once, at creation |
| Expiry | optional — a key can be created that never expires |
| Revocation | delete the key |
| Scope | **none** — a key carries the full authority of the user who created it |

### What a key is for today

An API key authenticates the **web-based automation integrations** that ship in the
release, notably Zapier and Make. Those run inside the web runtime and validate keys
against the same stored hash.

An API key is **not** currently a credential for a public REST API, because the published
release does not ship one. See [the API v2 roadmap](roadmap/api-v2.md).

### Handling

Because a key carries full user authority and can be created without expiry:

- create one key per consumer, so you can revoke precisely;
- set an expiry unless you have a reason not to;
- treat the plaintext as a password — it is shown once and cannot be recovered;
- revoke immediately when a consumer is retired.

There is no permission scoping to fall back on. Revocation is the control.

## Two-factor authentication

TOTP is present. Setup failures are known to report poorly, which makes misconfiguration
hard to diagnose — tracked as [#35](https://github.com/rubennati/cal.diy/issues/35).
