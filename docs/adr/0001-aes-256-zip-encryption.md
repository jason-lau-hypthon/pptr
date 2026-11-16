# Password-protected zips use AES-256, never `zip -P`

When the operator chooses to protect a zip, we encrypt with AES-256 via `@zip.js/zip.js`. We do not shell out
to `zip -P`, even though `zip` is already on every machine and would be one less dependency: `-P` puts the
password in the process arguments where any local user can read it from `ps`, and it produces ZipCrypto
encryption, which is broken against known-plaintext attack. The password is collected with a masked prompt or
from `ZIP_PASSWORD`, never from argv, and is never logged or written to disk.

## Consequences

- `@zip.js/zip.js` handles both encrypted and plain zips, so there is one code path rather than two.
- The resulting zips need a tool that understands AES-256 (7-Zip, modern WinZip, macOS Archive Utility is
  unreliable). If a recipient cannot open them, the zip must be written unencrypted — do not weaken the
  encryption to ZipCrypto to work around it.
