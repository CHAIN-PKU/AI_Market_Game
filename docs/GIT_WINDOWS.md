# Windows 下 Git / SSH — 供 Cursor Agent 自动 push

## 你为什么每次都要输入 passphrase？

`id_ed25519` 创建时设置了 **口令**。`git push` / `git fetch` 都要用私钥，OpenSSH 会向你索要口令。

**Cursor Agent 无法替你键入口令**，所以在 ssh-agent 未加载钥匙时，自动化 push 会失败。

---

## 推荐：开启 ssh-agent（输一次口令，本机长期有效）

### 一次性（必须「以管理员身份运行」PowerShell）

普通窗口执行 `Set-Service` / `Start-Service` 会 **拒绝访问**，这是正常现象。

1. 开始菜单搜 **PowerShell** → 右键 → **以管理员身份运行**
2. 执行：

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
Get-Service ssh-agent   # Status 应为 Running
```

**无法用管理员时**（学校/公司机策略）：跳过本节，改用下文 **「备选：HTTPS + gh」**。

### 每次开机或重启后（普通 PowerShell，做一次）

```powershell
ssh-add $env:USERPROFILE\.ssh\id_ed25519
ssh-add -l
```

看到 `ED25519 ... id_ed25519` 后，**同一 Windows 用户**下的 Cursor 终端里 `git push` / `git fetch` 一般 **不再询问口令**。

> 若 `ssh-add` 仍报 `No such file or directory`，说明 agent 服务未启动，回到管理员步骤。

---

## 已配置的 SSH

`C:\Users\28120\.ssh\config` 中 `Host github.com` 已指定：

- `IdentityFile .../id_ed25519`
- `IdentitiesOnly yes`

---

## 备选：HTTPS + gh（无管理员、最适合 Cursor 自动 push）

无法启动 `ssh-agent` 时 **优先用这条**：

```powershell
cd D:\AICivilization
git remote set-url origin https://github.com/CHAIN-PKU/AI_Market_Game.git
```

安装 GitHub CLI（未安装 `gh` 时）：

```powershell
winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
# 新开一个 PowerShell，或刷新 PATH 后执行：
& "C:\Program Files\GitHub CLI\gh.exe" --version
```

登录：

```powershell
gh auth login
# 选 GitHub.com → HTTPS → Login with a web browser
gh auth setup-git
```

之后在本机终端与 Cursor 里 `git push` 一般走 **缓存令牌**，不再问 SSH passphrase。创建 PR：

```powershell
gh pr create --title "..." --body "..."
```

## 备选：HTTPS + 凭据管理器（仅 Git）

```powershell
git remote set-url origin https://github.com/CHAIN-PKU/AI_Market_Game.git
```

安装 [GitHub CLI](https://cli.github.com/) 后：

```powershell
gh auth login
```

选 HTTPS + 浏览器登录；之后 `gh pr create`、`git push` 可走缓存凭据。

**给 Cursor 用 HTTPS：** 需在本机完成 `gh auth login` 一次；Agent 仍无法过浏览器，但 **Git Credential Manager** 可能静默提供 token（视你登录方式而定）。

---

## Cursor Agent 能自动做什么？

| 操作 | 条件 |
|------|------|
| `git commit` | 始终可以（本地） |
| `git push` / `fetch` | **ssh-agent 已加载钥匙**，或 HTTPS 凭据已缓存 |
| `gh pr create` | 已安装并 `gh auth login` |

**不能做的：** 在无人值守环境下**第一次**解锁带口令的私钥（除非你取消口令，不推荐）。

---

## 合并冲突 README 之后

```powershell
cd D:\AICivilization
git add README.md
git commit -m "merge: integrate GitHub initial commit, keep local README"
git push -u origin main
```
