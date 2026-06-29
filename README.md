# Convert [scratchblocks](https://scratchblocks.github.io/) Code to [Scratch](https://scratch.mit.edu/) Blocks

English | [中文](./README_ZH.md)

> [!IMPORTANT]
> This project is currently in early development and may have some issues.
>
> Please back up your Scratch projects to prevent data loss.

## Supported Editors

- [Scratch 3.0 Online](https://scratch.mit.edu/)
- [Scratch 3.0 Windows App](https://scratch.mit.edu/download)
- [TurboWarp Online](https://turbowarp.org/)
- [TurboWarp Windows App](https://turbowarp.org/desktop)
- [Gandi IDE (Co-Creation World)](http://ccw.site/gandi/)
- [Co-Creation World Classic Editor](https://www.ccw.site/creator/)
- Theoretically supports other Scratch 3.0-based editors (you can modify the `match` in the script to adapt)

## Installation

### Browser

Install [this userscript](https://luyifei2011.github.io/scratchblocks-to-scratch/scratchblocks-to-scratch.user.js) using a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [ScriptCat](https://scriptcat.org/).

### Desktop Application

Download the latest installer from the [Releases](https://github.com/LuYifei2011/scratch_desktop_patch_tool/releases) page and install it.

### ScratchAddons

I have submitted a [PR #8860](https://github.com/ScratchAddons/ScratchAddons/pull/8860), which has not been merged yet. Once merged, you will also be able to use this feature by installing ScratchAddons.

## How to Use

1. Right-click on an empty area in the code workspace and select **"Convert Text to Blocks"**.
2. The script will automatically paste from the clipboard, or you can manually paste scratchblocks code into the input box.
3. Click **"Parse"**.
4. Click **"Apply"**.

> [!NOTE]
> The automatic paste feature may not work due to permission issues. If it fails, please paste the code manually.

## License

This project is open source under the [GPL-3.0 License](LICENSE).

This project uses code from the following third-party libraries:
- [scratchblocks](https://scratchblocks.github.io/) (MIT License)
- [ScratchAddons](https://scratchaddons.com/) (GPL License)
