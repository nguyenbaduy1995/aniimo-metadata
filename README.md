# Aniimo RPC client (Node.js)

Standalone Node.js client for the two verified APAC microservice calls. It implements TCP framing, RSA-OAEP SHA-1 handshake, independent RC4 streams, streaming zlib, protobuf and MessagePack. No Python or running game is needed once you have a valid session.

## Setup

Use Node.js 20 or newer. Run `npm install`. Copy `.env.example` to `.env` and fill in your own UID, hexadecimal msAuth and cluster ID. Credentials are not included in this repository. Keep `.env` private: it contains a plaintext login credential and is ignored by Git. Do not share the entire folder including `.env`.

## Commands

```powershell
npm run user -- 405000100025
npm run search -- Kois
npm run search -- oiseki 5
```

`user` requests the 35 fields used by the game's public profile query and platform extension. It also decodes `stableAttributesStr` and calculates collection form counts. These are not current warehouse counts. Null fields mean no value returned.

`search` calls `UserDataService.getFuzzyNameAttribute(partialName, fields, limit)`. The default limit is 20, the value used by Lua. Results contain `Uid` and `AttributesMap`. This wrapper accepts limits 1â€“20; it does not implement pagination. Verified server results match fragments inside names and across letter case.

## Programmatic use

```js
import { AniimoClient } from './client.js';
const client = new AniimoClient();
try {
  await client.connect();
  console.log(await client.searchUsers('Kois', 5));
  console.log(await client.getUserInfo('405000100025'));
} finally {
  client.close();
}
```

Calls on one client must be sequential. `connect()` binds the supplied legitimate session; it does not perform account login or refresh credentials. The saved msAuth has no verified expiry time. If bind is rejected, obtain a fresh own-account session and update `.env`.

## Provenance

Ported from the successfully tested Python gateway client and decoded game Lua: ClientFriendComponent.queryPlayerInfo, queryPlayerInfoByFuzzyName; ClientFriendQueryConfig; platformAttributes; InfoPlayerCardCtrl collection counters. The client is for profile microservices, not gameplay throwing/catching entity RPCs.
## Technical notes

See [docs/README.md](docs/README.md) for Lua decompilation, packed data, session protocol, own-account msAuth acquisition and verified RPC behavior.
