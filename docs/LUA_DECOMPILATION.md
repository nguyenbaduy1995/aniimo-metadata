# Extracting and decompiling Aniimo Lua

## Inputs and tools

The inspected patch archive was `Aniimo_Data/cvs/res/patchv2/lua/ver/3668494/LuaScripts.xdf`. Despite its extension, this particular archive was readable with Python `zipfile.ZipFile`. Do not assume every XDF asset is a ZIP.

Extracted paths used `xfs/luascripts/`. LuaJIT bytecode starts with the bytes `1B 4C 4A` (ESC + LJ). Some files may already be text; preserve those as text rather than remapping them.

Tools used:

- [Aniimor](https://github.com/arrietybeu/Aniimor), `tool/decompiler/remap.py`, for the game opcode permutation.
- [luajit-decompiler-v2](https://github.com/marsinator358/luajit-decompiler-v2), release executable.
- `lupa.luajit21` for isolated syntax validation.

The local full-batch driver was `readonly_analysis/decompile_full_aniimor.py`. It retained `original/`, `remapped/`, `readable/` and per-file hashes.

## Procedure

1. Copy the patch archive to an analysis directory. Record its SHA-256 and version.
2. Enumerate `.lua` members with `zipfile`. Reject absolute paths and `..` path components before extraction. Preserve module directories and hash each original file.
3. For LuaJIT bytecode, remap instruction opcode bytes using the version-appropriate Aniimor mapping. Keep original bytes separately. Do not remap strings or arbitrary bytes throughout a file.
4. Decompile the remapped directory:

```powershell
luajit-decompiler-v2.exe remapped -o readable -f -s
```

5. Copy original text Lua into the readable tree when appropriate.
6. Compile each reconstructed text file with `loadstring` in an isolated LuaJIT runtime. Do not execute whole game modules just to test syntax.
7. Save all failures rather than editing code until it merely parses. For critical calculations, compare selected functions against bytecode with identical inputs and seeded randomness.

The inspected remapper parses LuaJIT ULEB128 headers and prototype instruction sections, then remaps the first byte of each four-byte instruction. An opcode mapping is build-specific; a decompiler error can indicate a mismatched mapping rather than bad game code.

## Verified outcome and limits

Patch 3668494: 8,631 Lua files extracted, 8,631 readable outputs, 8,630 syntax passes, one failure, no missing outputs. `Utils/LuaUIUtils/UIItemUtils.lua` exceeded LuaJIT's 60-upvalue limit after reconstruction; it remains an inspection artifact, not a compilable replacement.

Selected formula comparisons passed 135 cases in the recorded trial. This does not validate every decompiled function. Decompiled files are reconstructed source, not the developer's original source: formatting, comments and local names can be lost. No installed game files were replaced.

`pmdata.bin` is packed configuration, handled separately in [PACKED_DATA.md](PACKED_DATA.md).
