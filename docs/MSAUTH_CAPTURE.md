# Acquiring and storing your own msAuth

## Scope

This records the successful read-only inspection of the user's own running Aniimo process. It is not an account login bypass or a method for obtaining another player's credentials. The capture helpers named below remain local and are not bundled in this repository. The procedure depends on the exact native LuaJIT layout and needs fresh discovery after process restarts or updates.

## Successful acquisition procedure

1. Start the game and log in to your own account. Keep it running.
2. Identify the current process PID. Open it with process query and VM_READ rights; the inspected helper used OpenProcess access mask 0x410.
3. If Windows denies that read, use an explicitly authorized elevated helper through UAC. The successful attempt used no injection and no writes to game memory.
4. Enumerate readable committed private memory with VirtualQueryEx and bounded ReadProcessMemory calls. Search for the Lua key `msAuth`, then validate candidate GCstr objects rather than treating an arbitrary text hit as a credential.
5. Find tagged string references in Lua table nodes and inspect the associated value. The observed auth value was a 128-character hexadecimal string.
6. Identify the containing `__Properties__` table. Trace it back to its parent player entity and re-read the entity `uid`. Confirm this is the user's own player, not a target UID from a public lookup or another unrelated table.
7. Resolve clusterId from current runtime context and re-read it. In the observed attempt there was one distinct nonzero candidate, 100. The containing NetHandler table was not independently identified; successful gateway bind subsequently validated the captured combination for that attempt.
8. Re-read identity, parent relationship and auth immediately before saving. Abort on ambiguous or stale candidates.
9. Verify by calling PhonestGate.bind, then a small read-only profile request. Save only non-secret success metadata in logs.

## Layout observed in this process build

These offsets are not stable promises and must not be blindly reused across versions:

| Structure | Observed detail |
|---|---|
| GCstr | 24-byte header; gct byte at offset 9 = 4; uint32 string length at offset 20; payload starts at 24 |
| GCtab | 64-byte inspected header; gct byte at 9 = 11; node pointer at 40; uint32 hmask at 52 |
| Hash node | 24 bytes: TValue value, TValue key, next pointer (8 bytes each) |
| GC64 string TValue | upper 17-bit tag 0x1fffb; pointer in low 47 bits |
| GC64 table TValue | upper 17-bit tag 0x1fff4; pointer in low 47 bits |

The local helper chain included `inspect_runtime_memory.py`, `inspect_lua_key_headers.py`, `inspect_lua_auth_references.py`, `inspect_auth_owner_tables.py`, `inspect_auth_parents.py`, `inspect_entity_identity.py`, then `capture_own_session.py`. Reports supplied fresh discovered addresses; capture was not a fixed-address credential reader. A hard-coded address from one run will become stale.

## Storage and reuse

Initial storage used current-user Windows DPAPI encryption with an owner-only ACL. The encrypted payload contained ownUid, msAuth and clusterId. It can be decrypted in memory by the same Windows user; it is not a portable plaintext export.

At the user's request, the Node project's local `.env` contains a plaintext copy for reuse:

```dotenv
ANIIMO_OWN_UID=YOUR_OWN_UID
ANIIMO_MS_AUTH=YOUR_HEX_TOKEN
ANIIMO_CLUSTER_ID=YOUR_CLUSTER_ID
```

`.env` is ignored by Git; `.env.example` has placeholders only. Restrict local file access, never print the token, and never include it in commits, screenshots or support logs. The current repository contains no real session token. If it is accidentally committed, deleting the file in a later commit does not remove it from Git history; treat the exposed session as compromised.

The exact expiry is unknown. A successful bind proves acceptance at that moment. If it later fails, obtain a fresh own-account session; do not infer expiry solely from a local file's existence or modification time.
