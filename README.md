TLS Engine Desktop
==================

A cross-platform desktop application built with Rust and Tauri v2 for inspecting TLS connections, certificate chains, cipher suites, and transport metadata via the Kroatenwerk TLS Engine service.


Development
===========

The following instructions describe how to set up TLS Engine Desktop locally across Windows, macOS, and Debian-based Linux distributions.


System packages (Linux / Debian / Ubuntu)
-----------------------------------------
Update the package index:

sudo apt update

Install build essentials and webkit dependencies required by Tauri:

sudo apt install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libjavascriptcoregtk-4.1-dev \
  libwebkit2gtk-4.1-dev


NodeJS & PNPM
-------------
Install NodeJS (v18+) and PNPM:

node -v
pnpm -v


Project dependencies
--------------------
From the project directory, install the NodeJS dependencies:

pnpm install


Running the application
-----------------------
Start the desktop application in development mode:

pnpm tauri dev

To run the frontend dev server standalone in your browser:

pnpm dev


Building for production
-----------------------
Package the desktop application for your platform:

pnpm tauri build


Testing
-------

Run Rust unit tests:

cd src-tauri
cargo test

This tests domain validation, URL stripping, SQLite CRUD operations, and HTTP metadata header extraction.


Run frontend build check:

pnpm build


Architecture & Technical Decisions
----------------------------------

Rust-First Separation of Concerns
---------------------------------
All I/O, networking, data modeling, validation, and local storage are handled by the Rust backend.
HTTP and TLS requests are executed via asynchronous reqwest in Rust. The webview does not perform arbitrary HTTP requests or unrestricted fetch calls.


Header & Metadata Capture
-------------------------
The Kroatenwerk TLS service returns diagnostic metadata in HTTP response headers. The Rust client captures response headers prior to parsing the body, constructing an InspectionEnvelope that pairs transport metadata with diagnostic data.


Input Sanitization & Validation
-------------------------------
Raw user inputs (URL strings, hostname ports, extra whitespace) are normalized and validated against RFC 1123 / FQDN specifications in Rust before any network requests are dispatched.


Local Persistence & Offline Replay
----------------------------------
Uses rusqlite with bundled SQLite, compiling natively across macOS, Linux, and Windows without external library dependencies.
History records store complete JSON payloads along with metadata and timestamps. When an entry is selected from history, it renders immediately from SQLite without re-querying the API.
All database interactions use parameterized queries to eliminate SQL injection vulnerabilities.


Service Health Integration
--------------------------
Polls the GET /health endpoint to monitor backend availability. Features a live status indicator pill and diagnostic health modal.


Security Posture
----------------
Enforces standard TLS certificate verification via rustls-tls.
The webview operates with zero filesystem, shell, or unrestricted network permissions exposed. Frontend communication is restricted to designated Tauri IPC commands.


Project Structure
-----------------

tls-engine-desktop/
  src-tauri/
    Cargo.toml          - Rust manifest and dependencies
    tauri.conf.json     - Tauri v2 window and app settings
    capabilities/       - Minimal locked-down permissions
    src/
      main.rs           - Entry point
      lib.rs            - Invoke handlers and IPC setup
      models.rs         - Serde data structures
      client.rs         - API client and header extraction
      validator.rs      - Domain validation and sanitization
      db.rs             - SQLite persistence layer
  src/
    api.ts              - Tauri IPC bridge
    types.ts            - TypeScript definitions
    App.tsx             - Primary UI coordinator
    components/         - UI views, tabs, and modals
