# TLS Engine Desktop (`tls-engine-desktop`)

A cross-platform desktop application built with **Rust** and **Tauri v2** for inspecting TLS connections, certificate chains, cipher suites, and transport metadata via the Kroatenwerk TLS Engine service.

---

## 📸 Interface Design

The application features a dark slate-gray and cyan-blue aesthetic:
- **Left Navigation Rail:** Quick access to New Inspection, Saved History, Service Health, and Architecture Settings.
- **Middle History Sidebar:** Persistent inspection logs with live search, status indicators, `X-Cache` badges, and per-item deletion.
- **Main Diagnostic Workspace:**
  - **Overview Tab:** Summary of negotiated protocol, cipher suite, connection latency, remote IP, and trust status.
  - **Certificate Chain Visualizer:** Step-by-step leaf-to-root hierarchy with validity countdowns, SANs, public key parameters, and SHA-256 / SHA-1 fingerprints.
  - **TLS Protocols Matrix:** Active probes across TLS 1.0, 1.1, 1.2, and 1.3 with runtime availability and probe latencies.
  - **HTTP Transport Headers:** Captures and represents HTTP response headers including `X-Cache: HIT/MISS`, `Server`, and `Date`.
  - **Raw JSON Viewer:** Complete, syntax-formatted raw JSON response with one-click clipboard copy.

---

## 🏗️ Architecture & Technical Decisions

### 1. Rust-First Separation of Concerns
Rather than treating Tauri as a simple web browser wrapper, the application strictly delegates all I/O, networking, data modeling, validation, and storage to the Rust backend:
- **Networking (`src-tauri/src/client.rs`):** All HTTP/TLS communication is executed in Rust using asynchronous `reqwest`. The webview does **not** perform arbitrary HTTP requests or invoke frontend `fetch()` for production operations.
- **Header Capture:** The Kroatenwerk TLS service returns vital diagnostic metadata in HTTP response headers (such as `X-Cache: HIT/MISS`) that are absent from the JSON body. The Rust client captures these headers prior to parsing the body, constructing an `InspectionEnvelope` that combines transport metadata with diagnostic data.
- **Input Sanitization & Normalization (`src-tauri/src/validator.rs`):** Raw user inputs (e.g., `https://example.com/`, `sub.domain.org:443`, or ` EXAMPLE.COM `) are normalized and validated against RFC 1123 / FQDN specifications in Rust before any network requests are dispatched, preventing backend 404/500 errors and injection attacks.

### 2. Local History & Offline Replay (`src-tauri/src/db.rs`)
- **Embedded SQLite:** Uses `rusqlite` bundled with SQLite, compiling natively across macOS, Linux, and Windows without external library dependencies.
- **Zero-Network Offline Playback:** History records store the complete original JSON payload along with metadata and timestamps. When an entry is selected from history, it renders immediately from SQLite without re-querying the API.
- **Successful Scans Only:** Adheres to the specification by only persisting valid, successful inspections to local history.
- **SQL Security:** All database interactions utilize parameterized queries (`params![]`), strictly eliminating SQL injection vulnerabilities.

### 3. Service Health Integration
- Directly polls the `GET /health` endpoint.
- Provides a live status pill in the top bar (e.g., `Engine Online` vs `Engine Degraded`) and an interactive health diagnostic modal.

### 4. Security Posture
- **Strict TLS Verification:** Standard TLS certificate verification is enforced via `rustls-tls`; insecure bypasses (`danger_accept_invalid_certs`) are prohibited.
- **Locked-Down Tauri Capabilities:** The webview has zero filesystem, shell, or unrestricted network permissions exposed. Frontend access is restricted strictly to designated Tauri IPC commands (`invoke`).

---

## 🚀 Getting Started

### Prerequisites
- **Rust:** `rustc` and `cargo` (1.78+ recommended)
- **Node.js:** v18+ (tested on Node v26)
- **Package Manager:** `pnpm` (or `npm`)

### Installation
Clone the repository and install frontend dependencies:
```bash
git clone https://github.com/your-username/tls-engine-desktop.git
cd tls-engine-desktop
pnpm install
```

### Running in Development
To run the full Tauri desktop application:
```bash
pnpm tauri dev
```

To run the frontend dev server standalone in your web browser:
```bash
pnpm dev
```
*(Runs on `http://localhost:1420/` with mock/proxy fallback)*

### Building for Production
To package the desktop application for your platform (creates `.app`/`.dmg` on macOS, `.exe`/`.msi` on Windows, `.deb`/`.AppImage` on Linux):
```bash
pnpm tauri build
```

---

## 🧪 Testing

The test suite covers hostname validation, URL stripping, SQLite CRUD operations, and HTTP metadata header extraction.

### Run Rust Unit Tests
```bash
cd src-tauri
cargo test
```
*Output:*
```text
running 7 tests
test client::tests::test_extract_metadata_headers ... ok
test client::tests::test_extract_metadata_missing_headers ... ok
test validator::tests::test_invalid_domains ... ok
test validator::tests::test_valid_domains ... ok
test validator::tests::test_ips ... ok
test validator::tests::test_url_stripping ... ok
test db::tests::test_db_crud ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 finished in 0.00s
```

### Run Frontend Typecheck & Build Test
```bash
pnpm build
```

---

## 📁 Project Structure

```
tls-engine-desktop/
├── src-tauri/
│   ├── Cargo.toml            # Rust manifest (reqwest, rusqlite bundled, serde)
│   ├── tauri.conf.json       # Tauri v2 configuration & window settings
│   ├── capabilities/
│   │   └── default.json      # Minimal locked-down permissions
│   └── src/
│       ├── main.rs           # Desktop application entry point
│       ├── lib.rs            # Tauri invoke handlers & state setup
│       ├── models.rs         # Strongly-typed Serde data models
│       ├── client.rs         # API client & HTTP header extraction
│       ├── validator.rs      # RFC 1123 domain & URL sanitization
│       └── db.rs             # SQLite local storage & offline replay
├── src/
│   ├── api.ts                # Tauri invoke IPC bridge
│   ├── types.ts              # TypeScript interfaces
│   ├── App.tsx               # Primary workspace & tab coordinator
│   ├── App.css               # Slate-gray & cyan-blue styling
│   └── components/
│       ├── NavRail.tsx       # Left navigation bar
│       ├── HistoryPane.tsx   # History list & search pane
│       ├── OverviewTab.tsx   # TLS summary & connection metrics
│       ├── ChainTab.tsx      # Certificate hierarchy visualizer
│       ├── ProtocolsTab.tsx  # Protocol matrix & probe results
│       ├── HeadersTab.tsx    # X-Cache & HTTP headers
│       ├── RawJsonTab.tsx    # Raw JSON viewer with clipboard copy
│       ├── HealthModal.tsx   # Health check inspection modal
│       └── SettingsModal.tsx # Application & security information
└── package.json
```
