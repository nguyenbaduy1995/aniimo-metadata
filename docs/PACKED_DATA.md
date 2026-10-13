# Packed config, localization and scene coordinates

The inspected packed config is `Aniimo_Data/cvs/res/lua/LuaScripts/Common/Data/pmdata.bin`. The local reader is `readonly_analysis/packed_data_reader.py`. It reads the format directly; the reader is not bundled here.

## Verified reader structure

The last four bytes contain a little-endian root-table pointer. A table points to a descriptor containing key, type and offset arrays. String values use offsets to NUL-terminated UTF-8 strings. Nested-table values use pointers. Numeric types include doubles and signed/unsigned 8-, 16- and 32-bit integers.

Important implementation details from the inspected format:

- Numeric key kind 0 is a double (`d`), not an unsigned byte. Integral double keys can be normalized to integers before converting JSON map keys to strings.
- Key kinds 1, 3 and 5 use unsigned byte, uint16 and uint32 respectively.
- Type 7 is string, 8 is table and 9 is boolean; types 0–6 are numeric.
- A stored type at least 100 represents a back reference. Subtract 100 from its type, and resolve the value location backward from the offset slot by the stored distance. It does not mean "unknown type".

The back-reference behavior was checked against the installed native `xlua.dll`. Treat these details as observations of this build, not a universal serialization specification.

## Useful roots

- `chest_data`: chest templates, models, rewards and effects.
- `puppet_data`: Aniimo/entity templates.
- `scene_data`: scene configuration.
- `Scene.<sceneId>.scene_entity_data`: placed entities and coordinates.
- `Scene.<sceneId>.scene_spawner_data`: spawners.
- `rank_base_data`: leaderboard categories.
- `I18N.custom_en_data`: custom English localization. It does not resolve every localization ID; a missing lookup must remain unresolved.

SceneUtils can load partitioned scene tables, so extraction must account for parts rather than reading only one guessed filename.

## Coordinates and spawn identity

Placed records can contain `staticId`, `spawnerId`, `idInType`, `subType`, `position`, `rotation` and `sandboxId`. `position[1..3]` is world X/Y/Z; Y is height. These are not map-image pixels.

`staticId` identifies a configured placement; a live entity/actor ID identifies a currently instantiated object. ClientPuppet constructs `bornPosition` from synchronized `bornPosition_x/y/z`. The moving entity's current position can differ from its birth position.

A configured spawn point does not prove that an entity is currently present. Quest, spawner, instance and server conditions can affect availability. Offline map loading behavior must not be generalized to online respawn behavior. Scene 3000 has the editor name meaning "open-world scene".

For chest extraction, a Magnificent model or Gold effect is an explicit candidate criterion, not proof that its localized in-game name is "Gold Chest". Keep quest/boss/test records identifiable and do not claim all dynamic chests are covered by static placements.
