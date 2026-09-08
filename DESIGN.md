# SecureDoc Frontend Design System

## Purpose

This document is the visual and interaction source of truth for the
SecureDoc frontend.

SecureDoc is a security focused document application that selectively
protects sensitive fragments inside documents while keeping normal
content readable.

The frontend should communicate:

-   Security
-   Privacy
-   Trust
-   Technical credibility
-   Clarity
-   Simplicity

This design system is inspired by the Nexus Technical Topologies
reference, but it is adapted for SecureDoc. The product must remain
document first and security workflow focused. Do not reproduce the Nexus
concept literally.

------------------------------------------------------------------------

## 1. Core Visual Direction

### Design Character

SecureDoc should feel like a modern security operations workspace
combined with a professional document management application.

The interface should be:

-   Dark
-   Technical
-   Precise
-   Calm
-   Information dense without being cluttered
-   Professional
-   Easy to scan

Avoid making the application look like:

-   A generic SaaS dashboard
-   A college project template
-   A cyberpunk or hacker interface
-   An AI startup landing page
-   A WebGL showcase
-   A dashboard filled with meaningless metrics

### Primary Principle

**Technical atmosphere should support the product, never compete with
it.**

The document, sensitive field detection, protection state, authorization
state, and audit information are more important than decorative effects.

------------------------------------------------------------------------

## 2. Color System

Use the following core palette.

  Token            Value       Usage
  ---------------- ----------- --------------------------------------------
  Background       `#02040A`   Main application background
  Surface          `#18181B`   Cards, panels, elevated surfaces
  Primary          `#60A5FA`   Primary actions, active states, links
  Accent           `#93C5FD`   Secondary highlights and technical details
  Text Primary     `#FFFFFF`   Headings and important content
  Text Secondary   `#A1A1AA`   Supporting text and metadata
  Border           `#27272A`   Panel and control boundaries

### Semantic Colors

Semantic colors may be used when communicating actual state:

-   Success: restrained green
-   Warning: restrained amber
-   Error: restrained red
-   Information: blue

Semantic colors must not dominate the interface.

Do not use bright neon colors.

Do not use color alone to communicate state. Pair color with text or an
icon.

------------------------------------------------------------------------

## 3. Typography

### Primary Font

Use **Geist** for:

-   Page titles
-   Headings
-   Body text
-   Buttons
-   Navigation
-   Document names
-   Explanatory content

### Technical Font

Use **JetBrains Mono** for:

-   Technical metadata
-   Document IDs
-   Encryption algorithms
-   Status codes
-   Detection rules
-   Fragment identifiers
-   System labels
-   Audit metadata

Example:

``` text
PROTECTION ENGINE
AES-256-GCM
FRAGMENT_04
RBAC ACTIVE
```

### Type Hierarchy

Display text should be restrained. Do not use extremely large hero
typography inside the application.

Recommended hierarchy:

-   Page title: 32 to 40px
-   Section heading: 18 to 22px
-   Card heading: 15 to 18px
-   Body: 14 to 16px
-   Supporting text: 13 to 14px
-   Technical labels: 11 to 12px

Body text should generally use a line height around 1.5 to 1.6.

------------------------------------------------------------------------

## 4. Spacing

Use an 8px spacing base.

Common values:

``` text
8px
16px
24px
32px
40px
48px
64px
```

Use:

-   16px for compact control gaps
-   24px for card padding
-   32px for major content grouping
-   48px or more between major page sections

Do not create arbitrary spacing values unless required by the layout.

------------------------------------------------------------------------

## 5. Radius

The Nexus reference uses large rounded controls and cards.

SecureDoc should adapt this rather than applying large radii everywhere.

Recommended:

-   Cards: 16 to 20px
-   Controls: 10 to 14px
-   Small badges: pill shape
-   Modal/dialog containers: 16 to 20px

Avoid extremely rounded cards that make the application look playful.

------------------------------------------------------------------------

## 6. Borders and Surfaces

Use subtle borders to establish hierarchy.

Preferred pattern:

``` text
dark background
    ↓
slightly lighter surface
    ↓
subtle border
    ↓
clear content hierarchy
```

Do not rely heavily on shadows.

Use shadows primarily for:

-   dialogs
-   popovers
-   elevated menus
-   important floating elements

Cards should generally feel integrated into the interface rather than
floating dramatically.

------------------------------------------------------------------------

## 7. Application Shell

The main application should use a persistent workspace structure.

``` text
┌──────────────────────────────────────────────────────────┐
│ SecureDoc                                                │
├───────────────┬──────────────────────────────────────────┤
│               │                                          │
│ Overview      │ Main content                             │
│ Documents     │                                          │
│ Security      │                                          │
│ Audit         │                                          │
│               │                                          │
│               │                                          │
│ User          │                                          │
└───────────────┴──────────────────────────────────────────┘
```

The exact navigation available to the user depends on role.

### Sidebar

The sidebar should:

-   Be compact
-   Clearly show the active page
-   Use Lucide icons
-   Use technical labels sparingly
-   Keep branding visible
-   Contain user/session information near the bottom

The sidebar should not dominate the viewport.

### Mobile

On mobile:

-   Replace the persistent sidebar with a drawer or compact navigation
-   Keep the current page obvious
-   Preserve keyboard accessibility
-   Prevent horizontal overflow

------------------------------------------------------------------------

## 8. Navigation Labels

Use normal product language for primary navigation:

-   Dashboard
-   Documents
-   Security
-   Audit

Technical labels may be used as secondary metadata, for example:

``` text
SYSTEM STATUS
PROTECTION ENGINE
ACCESS CONTROL
```

Do not replace normal UX language with cryptic labels just to look
technical.

------------------------------------------------------------------------

## 9. Dashboard

The dashboard should immediately communicate the product purpose.

Primary message:

> Protect sensitive fields without locking the entire document.

The first viewport should prioritize:

1.  Workspace identity
2.  Protection status
3.  Recent documents
4.  Primary document action

Avoid making generic analytics the focal point.

### Security Status Panel

The security status area can present:

``` text
PROTECTION STATUS        ACTIVE

ENCRYPTION               AES-256-GCM
KEY STRATEGY             PER-DOCUMENT
ACCESS CONTROL           RBAC
PROTECTED FRAGMENTS      10
```

Only display values that are available from the backend or explicitly
marked as safe mock/demo values.

Do not invent security metrics for visual decoration.

------------------------------------------------------------------------

## 10. Document UI

Documents are the core product object.

The UI should make documents easy to identify and scan.

A document card may show:

-   Name
-   File type
-   Owner
-   Creation date
-   Protection state
-   Sensitive field count
-   Safe masked preview

Example:

``` text
Confidential Operations Report     DOCX
confidential-operations-report.docx

Owner: maria.santos
Created: Sep 5, 2026
Sensitive fields: 4

Owner: Operations Team
Contact: [REDACTED:EMAIL]
Database Password: [REDACTED:PASSWORD]
Stripe Key: [REDACTED:API_KEY]
```

Never put real secrets into frontend mock data.

------------------------------------------------------------------------

## 11. Sensitive Data Presentation

Sensitive data is central to SecureDoc.

The frontend must never expose real:

-   Passwords
-   API keys
-   Credit card numbers
-   Bearer tokens
-   Encryption keys
-   Ciphertext
-   Other secret material

Use safe representations:

``` text
[REDACTED:PASSWORD]
[REDACTED:API_KEY]
[REDACTED:CREDIT_CARD]
[REDACTED:EMAIL]
```

or:

``` text
[SECUREDOC:demo-fragment]
```

### Detection UI

When scan results are introduced, show metadata rather than sensitive
values.

Example:

``` text
DETECTION RESULT

PASSWORD
Confidence 0.99
Rule: explicit_password_field

API_KEY
Confidence 0.95
Rule: explicit_api_key_field
```

Never display the detected secret itself.

------------------------------------------------------------------------

## 12. Encryption Visualization

SecureDoc's core concept should be visually understandable.

The preferred conceptual flow is:

``` text
Readable document
       ↓
Sensitive fields detected
       ↓
Sensitive fragments protected
       ↓
Protected document
       ↓
Authorized retrieval
       ↓
Original content reconstructed
```

When demonstrating the storage representation, show safe placeholders:

``` text
Project notes: meeting moved to Friday.

Password: [SECUREDOC:fragment]

Card: [SECUREDOC:fragment]
```

The rest of the document should remain visually unchanged.

This distinction is important because SecureDoc is not whole-document
encryption.

------------------------------------------------------------------------

## 13. Status Language

Use precise status language.

Preferred examples:

``` text
PROTECTED
SCAN COMPLETE
ACCESS CONTROLLED
DECRYPTION REQUIRED
ACCESS DENIED
AUTHORIZATION REQUIRED
```

Avoid vague labels such as:

``` text
Awesome
Super Secure
Safe Mode
AI Protected
```

The product should sound factual rather than promotional.

------------------------------------------------------------------------

## 14. Buttons and Controls

Primary actions should use the primary blue token.

Examples:

``` text
New Document
Create Document
Upload Document
Scan Document
Decrypt Document
Authenticate
```

Secondary actions should have lower visual weight.

Dangerous or privileged actions such as ADMIN decryption should be
visually distinct and require explicit interaction.

Buttons need:

-   Hover state
-   Focus state
-   Disabled state
-   Loading state when applicable

Do not use animation as a substitute for feedback.

------------------------------------------------------------------------

## 15. Cards and Panels

Cards should use:

-   Surface background
-   Subtle border
-   Consistent padding
-   Consistent radius
-   Clear heading
-   Optional technical metadata

Avoid nesting too many cards inside cards.

A page should have a clear visual hierarchy instead of every section
looking like a separate floating container.

------------------------------------------------------------------------

## 16. Technical Metadata

Use JetBrains Mono and uppercase labels for technical information.

Examples:

``` text
DOCUMENT_ID
PROTECTION_STATUS
ENCRYPTION
KEY_VERSION
FRAGMENT_COUNT
ACCESS_LEVEL
AUDIT_EVENT
```

Technical metadata should be visually secondary to the main user-facing
content.

Do not make the entire application monospace.

------------------------------------------------------------------------

## 17. Motion

Motion should be restrained.

Acceptable uses:

-   Sidebar drawer transitions
-   Page entrance
-   Button feedback
-   Hover lift
-   Detection highlight transitions
-   Encryption/decryption state transitions
-   Loading indicators

Keep animation short and functional.

Avoid:

-   Constant particle effects
-   Excessive floating elements
-   Large parallax effects
-   Distracting background movement
-   Animation on every card

If an atmospheric background or WebGL-style effect is used, it must
remain behind the interface and never reduce readability or performance.

------------------------------------------------------------------------

## 18. Nexus Reference Adaptation

The original Nexus reference emphasizes:

-   Dark technical surfaces
-   Blue primary/accent colors
-   Geist typography
-   JetBrains Mono for technical labels
-   Compact operational panels
-   Structured data hierarchy
-   Restrained motion
-   Atmospheric technical effects

SecureDoc adopts these principles but does not copy the original "Global
Intelligence Grid" concept.

Do not introduce unrelated concepts such as:

-   Planetary networks
-   Global intelligence grids
-   Fake telemetry
-   Fake infrastructure maps
-   WebGL topology visualizations

unless a future feature has a real product reason for them.

The visual language should suggest a secure technical system while
remaining grounded in document protection.

------------------------------------------------------------------------

## 19. Responsive Rules

### Desktop

Prioritize:

-   Persistent sidebar
-   Two-column or multi-panel layouts where useful
-   Comfortable document reading width
-   Dense but readable metadata

### Tablet

-   Reduce sidebar width or use collapsible navigation
-   Stack secondary panels
-   Preserve document readability

### Mobile

-   Drawer navigation
-   Single-column content
-   Full-width controls
-   Cards stack vertically
-   Avoid horizontal scrolling
-   Preserve clear action hierarchy

------------------------------------------------------------------------

## 20. Accessibility

The UI must support:

-   Semantic HTML
-   Keyboard navigation
-   Visible focus states
-   Accessible buttons
-   Appropriate ARIA labels
-   Sufficient contrast
-   Text labels for important statuses

Do not rely solely on:

-   Color
-   Icons
-   Animation

to communicate important information.

------------------------------------------------------------------------

## 21. Security UI Rules

The frontend is not the authorization authority.

Real authorization remains enforced by the backend.

The frontend should:

-   Respect the authenticated user's role
-   Hide actions that the current role cannot perform
-   Handle 401 and 403 responses distinctly when API integration is
    added
-   Never assume that hiding a button provides security
-   Never store or display cryptographic secrets
-   Never place production credentials in source code

For mock phases, all sensitive data must remain masked.

------------------------------------------------------------------------

## 22. Data and API Boundary

Frontend components should not import mock data directly.

Use:

``` text
Component
    ↓
Service
    ↓
Mock data
```

Later:

``` text
Component
    ↓
Service
    ↓
FastAPI
```

This keeps the visual layer independent of the data source.

Service functions should map cleanly to real backend operations.

------------------------------------------------------------------------

## 23. Design Drift Rules

When implementing new frontend phases:

1.  Reuse existing components.
2.  Reuse existing spacing and typography.
3.  Reuse existing colors and semantic states.
4.  Do not introduce a second visual language.
5.  Do not add a new UI library just for one feature.
6.  Do not redesign the application shell without a concrete reason.
7.  Keep new features visually consistent with existing pages.
8.  Prefer product clarity over visual novelty.

Any significant visual change should be deliberate and consistent across
the application.

------------------------------------------------------------------------

## 24. Final Design Principle

SecureDoc should look like a real security product.

The interface should make one idea immediately understandable:

**Protect the sensitive fragments, not the entire document.**

Technical aesthetics, motion, typography, and dark surfaces exist to
reinforce that idea.

They should never obscure it.
