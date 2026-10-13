# Session and microservice gateway protocol

## What the saved session contains

The working credentials are your own `ownUid`, hexadecimal `msAuth`, and `clusterId`. The observed msAuth was 128 hex characters, representing 64 bytes. It is not a JWT with a directly readable `exp` field. No explicit expiry timestamp was captured or found in the inspected client paths; do not invent a lifetime.

The player component calls `bindGlobalMsGate(uid, msAuth)` and can bind an extra global gateway as well. `on_msAuth_changed` triggers the bind path. `refreshAuth()` sends gameplay RPC `RPC_CS_Avatar_RefreshAuth`; this repository does not implement that gameplay connection or token refresh.

The saved session successfully authenticated on the inspected APAC gateway. That does not establish validity forever, on other regional gateways, or for every service.

## Connection sequence implemented by this repository

Default APAC host: `worldx-ap-prod-ms-gate-close.kingsgroupgames.com`, port `10000`.

1. Open a TCP connection and send frame index 1 requesting an encryption token.
2. Read index 10, protobuf EncryptToken.
3. Generate a 20-byte session key (the tested client uses SHA-1 of random bytes).
4. Encode EncryptKey with random head/tail padding, key and the received token. Encrypt using the shipped RSA public key, OAEP with SHA-1.
5. Send index 2, protobuf EncryptKeyString.
6. Use independent RC4 receive/send states. Incoming bytes are decrypted, then inflated. Outgoing frames are compressed using one continuing zlib stream with Z_SYNC_FLUSH, then encrypted. Cipher/compressor state continues between packets.
7. Read index 11 acknowledging encryption setup.
8. Call `PhonestGate.bind([ownUid, msAuthBytes, clusterId])`. Proceed only when `Ret[0]` is true.
9. Make the desired profile/name query. Close cleanly afterward.

Frame layout: uint32 little-endian body length, uint16 little-endian message index, protobuf payload. The body length includes the two-byte index but excludes the four-byte length field.

Verified service request/response indices are 33/34. MsRequest contains request ID, service, method, MessagePack parameters, context and options. The working requests use an empty protobuf callerId and the own-account callerId in options where required. The bind auth bytes use legacy MessagePack raw encoding, as in the tested Python client; changing binary encodings may change server interpretation.

## Boundaries

Gameplay actions use an entity RPC path (`serverMsg` -> `sendEntityMessageV2`), not the profile MsRequest call by itself. A valid profile session does not make throwing, AOI reads or arbitrary gameplay RPCs implemented. Some inspected RankService calls returned ERR_ACCESS_INVALID even after successful bind; the cause is unresolved.

See `client.js` and `wire.proto` for the executable implementation. This client supports sequential calls, not simultaneous RPC requests on one connection.
