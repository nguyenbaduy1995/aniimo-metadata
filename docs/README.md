# Reverse-engineering notes

These notes describe work verified against the locally installed Aniimo patch 3668494. They are written in English for reuse. They distinguish reconstructed client logic, offline tests and actual server responses.

- [Lua extraction and decompilation](LUA_DECOMPILATION.md)
- [Packed config and scene coordinates](PACKED_DATA.md)
- [Session and gateway protocol](SESSION_PROTOCOL.md)
- [Acquiring and storing your own msAuth](MSAUTH_CAPTURE.md)
- [Verified RPCs and unresolved behavior](RPC_REFERENCE.md)

No game archives, reconstructed game source, memory dumps, account tokens or account identifiers are bundled with these notes. Local helper filenames below describe the analysis workspace; those helpers are not shipped in this repository. The Node RPC client itself is shipped and independently runnable with a valid own-account session.

- [Step-by-step agent Lua decoding playbook](../agent_decode_lua.md)
