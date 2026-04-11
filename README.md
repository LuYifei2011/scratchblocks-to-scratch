# 将 [scratchblocks](https://scratchblocks.github.io/) 代码转换为 [Scratch](https://scratch.mit.edu/) 积木块

> [!IMPORTANT]
> 此项目目前处于早期开发阶段，可能存在一些问题。
> 
> 请备份您的 Scratch 项目，以防止数据丢失。

## 适配的编辑器

- [Scratch 3.0 在线版](https://scratch.mit.edu/)
- [Scratch 3.0 Windows 版](https://scratch.mit.edu/download)
- [TurboWarp 在线版](https://turbowarp.org/)
- [TurboWarp Windows 版](https://turbowarp.org/desktop)
- [共创世界 Gandi IDE](http://ccw.site/gandi/) (目前有些问题，无法正常使用，后续会修复)
- [共创世界 传统编辑器](https://www.ccw.site/creator/)
- 理论上也支持其他基于 Scratch 3.0 的编辑器 (可以自行修改脚本里的 `match` 以适配)

## 安装

### 浏览器

使用 [篡改猴(Tampermonkey)](https://www.tampermonkey.net/) 或 [脚本猫](https://scriptcat.org/) 等用户脚本管理器安装 [此脚本](https://luyifei2011.github.io/scratchblocks-to-scratch/scratchblocks-to-scratch.user.js)。

### 桌面应用

使用 PowerShell 运行:

```powershell
irm https://luyifei2011.github.io/scratchblocks-to-scratch/patch-desktop.ps1 | iex
```

> [!NOTE]
> 如果您在运行脚本时遇到权限问题，请以管理员身份重新运行 PowerShell。
>
> 如果出现乱码，请使用 PowerShell 7 或更高版本，
> 
> 或者使用以下代码:
> ```powershell
> & {$w=New-Object Net.WebClient;$w.Encoding=[Text.Encoding]::UTF8;iex $w.DownloadString('https://luyifei2011.github.io/scratchblocks-to-scratch/patch-desktop.ps1')}
> ```

> [!NOTE]
> 您可以使用以下方法打开 PowerShell
>
> 1.右键 开始菜单 按钮 (Windows 徽标按钮)
> 
> 2.点击 终端(管理员)

### ScratchAddons

我提了一个 [PR #8860](https://github.com/ScratchAddons/ScratchAddons/pull/8860)，目前还未合并。如果将来合并了，您也可以通过安装 ScratchAddons 来使用这个功能。

## 使用方法

1. 打开编辑器。
2. 点击顶栏的 “将文本转换为积木” 按钮。
3. 在弹出的输入框中输入或粘贴 Scratchblocks 代码。
4. 点击 “解析” 按钮，然后点击 “应用” 按钮。

## 许可证

本项目采用 [GPL-3.0 许可证](LICENSE) 开源。

本项目使用了以下第三方库的代码：
- [scratchblocks](https://scratchblocks.github.io/) (MIT 许可证)
- [ScratchAddons](https://scratchaddons.com/) (GPL 许可证)
