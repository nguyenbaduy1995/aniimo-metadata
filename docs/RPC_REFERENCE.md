# Verified profile and name RPCs

## Get player profile by UID

`UserDataService.getAttribute([targetUid, fields])`, after your own authenticated gateway bind. Options include your own callerId. The target UID is not the caller identity.

The response has `Ret` and `AttributesMap`. The Node default requests 31 base profile fields plus four platform fields, listed in `profile-fields.json`. The returned `uid` field can be null; the caller already knows the target UID from the request. Null means no returned value, not zero.

`stableAttributesStr` is Base64(MessagePack), decoded by the game ProtoCodec. Its observed decoded keys are catchedPetSet, blockCatchedPetMap and countryPetFormCountMap. The other-player profile UI sums countryPetFormCountMap masks 2 (caught forms), 8 (Sparkling caught forms) and 512 (Prismana caught forms). These are collection form counts, not current warehouse inventory. The compact caught set and area research entries are not a full capture history.

`curShow` is encoded compressed display data. It was separately decoded locally with Base64 then zlib. The Node client retains its raw value; it does not execute returned display text.

## Find UID by partial player name

`UserDataService.getFuzzyNameAttribute([partialName, fields, limit])`, options with your own callerId. Lua uses `Const.Friend.RECOMMEND_PAGE_LIMIT = 20`.

Response: `Ret`, `Results`, with each result containing `Uid` and `AttributesMap`. Live tests confirmed partial fragments inside player names and matching across letter case. The Node wrapper accepts a limit from 1 to 20; it does not supply pagination or claim to retrieve every match.

This is distinct from `NameService.findName([fullName])`. Tested exact-name lookup returned one Uid; fragments and a lowercase variation did not match in that exact-name test. The earlier conclusion based only on findName was incomplete: the separate fuzzy method was subsequently found and verified.

## Other discovered calls and limitations

- `UserDataService.batchGetAttribute`: multiple public profiles, observed in Lua; not implemented as a separate public method here.
- `RoleService.CS_GetRandomUids(count, clusterId)`: client uses it in its random-online-player flow; not live-tested here.
- `HandBookService.CS_GetHandBookData`: observed own-session handbook request, no arbitrary target UID argument shown.
- `RankService.getRankTabMapping` -> `rangeRankMembers`: six configured tabs were attempted; all mapping calls returned ERR_ACCESS_INVALID. No top-five leaderboard was obtained.
- Rank config 10001 contains Boss Rush individual total and left/middle/right team categories. Rank 1's level and owned-Aniimo-count tabs are explicitly labeled test rankings. Config existence does not prove a feature is open.
- Catching RPCs and nearby entity AOI belong to the gameplay connection. They are not implemented in this microservice client. Offline throw-function tests do not prove live server acceptance or refunds.

Source modules: ClientFriendComponent.lua, ClientFriendQueryConfig.lua, SDK/Platform/EntityMixin/ImpPlatformClientFriendComponent.lua, InfoPlayerCardCtrl.lua, Core/Common/ProtoCodec.lua, ClientAvatarMsCommon.lua, LoginAgent.lua, Core/Client/ServerProxy.lua, and packed rank_base_data.
