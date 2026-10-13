# Agent playbook: decoding Aniimo Lua step by step

This guide is for coding agents such as Claude, Gemini and Codex. Follow the steps in order and leave enough evidence for another agent to resume your work. Write explanations from actual files; never fill missing game logic with guesses.

## 1. Establish the workspace and scope

Ask for a game installation or archive path only if none is available. Inspect repository instructions such as AGENTS.md before working. Identify the patch/version the user wants. Work on analysis copies; do not replace installed game files.

The verified local example was patch **3668494**:

```text
<game>/Aniimo_Data/cvs/res/patchv2/lua/ver/3668494/LuaScripts.xdf
```

This guide is a procedure, not a promise that the same path, format or opcode mapping applies to every version. This repository does not include game archives, the decompiler executable or the local analysis helpers mentioned in other documents.

Create a separate output directory:

```text
analysis/<version>/
  original/
  remapped/
  readable/
  reports/
```

Record absolute input paths, archive size, SHA-256, tool versions and download sources. Search with `rg` / `rg --files` where available. Keep earlier versions separate.

## 2. Inspect the archive before extraction

The inspected LuaScripts.xdf was a ZIP container despite its extension. Check rather than assume:

```python
from pathlib import Path
import zipfile

archive = Path(r"<absolute path to LuaScripts.xdf>")
print("ZIP:", zipfile.is_zipfile(archive))
if zipfile.is_zipfile(archive):
    with zipfile.ZipFile(archive) as z:
        lua_names = [n for n in z.namelist() if n.endswith(".lua")]
        print("Lua members:", len(lua_names))
        print(lua_names[:10])
```

If this fails, stop using ZIP assumptions and inspect the actual container. Do not report files as decoded when you have only listed their names.

## 3. Extract safely and preserve originals

For each member, reject absolute paths, drive-qualified paths and `..` components. Verify its resolved destination remains inside the intended output root. Then extract while preserving its module path, typically `xfs/luascripts/...`.

Record a manifest entry for every Lua member:

```json
{
  "path": "xfs/luascripts/Example.lua",
  "original_bytes": 1234,
  "sha256": "<actual hash>",
  "bytecode": true
}
```

Classify by contents, not extension:

- LuaJIT bytecode starts with `b'\x1bLJ'`.
- Already-readable Lua text should be copied unchanged into the readable output.
- Unknown binary data needs separate investigation.

Keep original bytes immutable. Do not overwrite them during remapping or decompilation.

## 4. Obtain and inspect the tools

Verified tool sources:

- [Aniimor](https://github.com/arrietybeu/Aniimor), `tool/decompiler/remap.py`.
- [luajit-decompiler-v2](https://github.com/marsinator358/luajit-decompiler-v2), release executable.

Read the remapper and its invocation syntax before running it. Record the exact revision and executable checksum. Do not run unrelated game patching/injection tools just because they are in the same repository.

The local driver used a copy whose importable entry point was `remap_file(src, dst)`. Confirm the tool you downloaded exposes that entry point before copying the example below. A CLI wrapper can silently skip failed files; prefer per-file calls with explicit error records.

## 5. Remap bytecode opcodes

Aniimo's inspected LuaJIT bytecode uses an opcode permutation. A standard decompiler needs the instructions remapped to the standard opcode set first.

The inspected remapper parses ULEB128 headers and prototype boundaries, locates four-byte instructions, and remaps the first byte of each instruction. Do not perform a global byte replacement over the whole file; constants, strings and metadata are not instruction opcodes.

Example driver pattern, after confirming the tool API:

```python
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("aniimor_remap", Path("<remap.py>"))
remap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(remap)

# Use real paths discovered in the extraction manifest.
src = Path("<original bytecode file>")
dst = Path("<remapped bytecode file>")
dst.parent.mkdir(parents=True, exist_ok=True)
assert src.read_bytes().startswith(b'\x1bLJ')
assert remap.remap_file(str(src), str(dst)) is True
```

Keep a per-file success/error log. Do not reuse an older mapping blindly after a game update. If output looks structurally wrong, investigate version/mapping compatibility before inventing source-level repairs.

## 6. Decompile to a separate readable directory

The verified command was:

```powershell
luajit-decompiler-v2.exe "<analysis/version/remapped>" -o "<analysis/version/readable>" -f -s
```

Confirm flags with the downloaded tool's help if using a different release. Capture its exit status and diagnostics. Compare the manifest with output paths to detect missing files. Copy original text Lua into the readable tree where the decompiler did not handle it.

Preserve the module directory structure. A readable output is reconstructed source, not the original developer source. Comments, names and formatting may be missing or reconstructed.

## 7. Validate syntax without running game modules

Use an isolated compatible LuaJIT parser. The recorded workflow used `lupa.luajit21`:

```python
from lupa.luajit21 import LuaRuntime

lua = LuaRuntime(register_eval=False, register_builtins=False)
lua.execute('os=nil; io=nil; package=nil; require=nil; python=nil; ffi=nil')
compile_only = lua.eval('function(s) local f,e=loadstring(s); return f~=nil,e end')

source = open("<readable Lua file>", "rb").read()
ok, error = compile_only(source)
print("syntax_pass" if ok else "syntax_fail", error)
```

Run this for every output. `loadstring` compiles the source; do not call the returned function during a syntax check. Save missing-output, parse-failure and validation-error records separately.

A syntax pass does not prove behavioral equivalence. Do not conceal a failure with an unverified logic rewrite.

Reference result for patch 3668494: 8,631 extracted Lua files, 8,631 readable outputs, 8,630 syntax passes and one failure. `Utils/LuaUIUtils/UIItemUtils.lua` exceeded LuaJIT's 60-upvalue limit after reconstruction. These counts are a historical reference, not expected counts for every installation.

## 8. Validate behavior where it matters

For formulas, protocol wrappers or other critical functions:

1. Locate the exact function and dependencies in the readable output.
2. Select normal and boundary inputs; seed random generators consistently.
3. Compare bytecode execution with reconstructed-source execution in compatible isolated runtimes.
4. Mock only necessary engine boundaries, and label every mock.
5. Record inputs, outputs, source hashes and any differences.

The recorded trial passed 135 selected formula comparisons. That evidence does not validate every function or establish server-side behavior. Mocked network calls prove only which calls the client emits; they do not prove acceptance, inventory changes, capture results or refunds.

If using the installed custom xlua.dll to execute unmodified original bytecode, document its exact build and Lua C API. Do not assume a standard LuaJIT runtime can execute the game's original opcode permutation.

## 9. Decode packed configuration separately

`pmdata.bin` is not a Lua bytecode file. Do not feed it through the decompiler or describe unreadable config fields as absent.

Read [docs/PACKED_DATA.md](docs/PACKED_DATA.md) for the observed table format, double numeric keys and types >=100 back references. Preserve unresolved fields explicitly. A missing English localization lookup is not permission to guess the name.

## 10. Explain findings with evidence

For each conclusion, include the source module, function, line location where useful, and config/version involved. Trace callers and callbacks instead of explaining a function from its name alone.

Use these evidence levels:

| Evidence | What you may claim |
|---|---|
| Config record | The local file contains the setting/placement |
| Client function | The client contains this branch or sends these arguments |
| Offline execution with mocks | This tested client path emitted the observed calls |
| Live response | The server accepted/rejected this request at test time |
| Missing server code | Server calculation/validation remains unresolved |

Do not infer that a feature is enabled because its RPC exists. Do not infer a spawn probability from rendering code. Do not confuse a template ID, static placement ID, actor ID and user UID. Do not equate collection form counts with current owned inventory.

## 11. Deliver artifacts and a resumable handoff

Deliver a concise summary and these files:

- `manifest.json`: archive/version and original per-file hashes.
- `validation.json`: a result for every expected output.
- `failures.json`: unresolved or missing outputs.
- `README.md`: tools, commands, counts, scope and limitations.
- Readable output tree, or an archive of it when requested and appropriate.
- Selected behavior-test evidence, clearly identifying mocked boundaries.

A handoff must state what is complete, what failed, what remains unverified and how to continue. Keep credentials, .env files, process memory dumps and live session data out of commits and shared artifacts. Never claim to have manually understood every module merely because all files were extracted or indexed.