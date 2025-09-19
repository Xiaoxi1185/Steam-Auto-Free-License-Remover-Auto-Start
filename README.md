# Steam Free License Auto Remover  
（Steam 一键清库存）

---

## 简介 | Description

本脚本用于清理 Steam 库存，支持一键删除所有免费添加的游戏许可，不会影响已购买的游戏。  
为避免触发 Steam 限速，默认删除操作间隔约为 5 分钟，建议勿随意缩短。  
删除的游戏许可通常可通过商店页面重新添加，但部分已下架游戏可能无法恢复。  
请在使用前确认是否确实需要删除。使用本脚本存在一定风险，操作即视为已了解并接受风险，因脚本导致的任何损失，作者概不负责。

This script helps you clean up your Steam inventory by removing all free licenses with one click. It will not affect games you have purchased.  
To avoid triggering Steam rate limits, the deletion interval defaults to 5 minutes and is not recommended to shorten.  
Deleted licenses can usually be re-added through the store page, but some removed games may no longer be available.  
Please confirm before deleting. Use at your own risk; the author is not responsible for any loss caused by this script.

---

## 功能 | Features

- 自动扫描并列出所有可删除的免费许可  
- 一键自动删除，间隔可防止限速  
- 显示当前删除进度和预计剩余时间  
- 简单操作，直接在 Steam 库存许可页面运行

- Automatically scans and lists all removable free licenses  
- One-click automatic removal with interval to prevent rate limiting  
- Displays current progress and estimated remaining time  
- Easy to use, runs directly on Steam license inventory page

---

## 使用说明 | Usage

1. 在支持用户脚本的浏览器插件（如 Tampermonkey、Violentmonkey）中安装本脚本。  
2. 打开页面：https://store.steampowered.com/account/licenses/  
3. 页面加载后，点击“🧹开始清理”按钮开始自动删除。  
4. 请保持页面开启，等待脚本完成所有操作。  

1. Install this script using a userscript manager like Tampermonkey or Violentmonkey.  
2. Navigate to: https://store.steampowered.com/account/licenses/  
3. After the page loads, click the "🧹开始清理" button to start automatic removal.  
4. Keep the page open and wait until the script finishes all operations.

---

## 常见问题 | FAQ

**Q1: 为什么删除速度很慢？**  
A1: Steam 对删除操作有限速，默认间隔3分钟，建议不要缩短，以免被拒绝。

**Q2: 删除后还能恢复游戏吗？**  
A2: 大部分免费许可可以通过商店重新添加，部分已下架游戏可能无法恢复。

**Q3: 出现错误代码84怎么办？**  
A3: 该错误通常是操作过快触发限速，请等待一段时间后重试。

**Q4: 脚本没有反应或找不到按钮？**  
A4: 确认页面正确且完全加载，Steam页面改版可能导致脚本暂时失效。

**Q5: 会删除已购买的游戏吗？**  
A5: 不会，脚本只删除免费许可，不影响已购买游戏。

---

**Q1: Why is the deletion slow?**  
A1: Steam rate limits removal operations. The default 3-minute interval prevents request rejections.

**Q2: Can I restore deleted games?**  
A2: Most free licenses can be re-added via the store. Some removed or delisted games may be unrecoverable.

**Q3: What if I get error code 84?**  
A3: It usually means you're acting too fast and triggered rate limiting. Wait and try again later.

**Q4: Script does nothing or cannot find buttons?**  
A4: Make sure you are on the correct page and it has fully loaded. Steam layout changes might break the script temporarily.

**Q5: Will purchased games be deleted?**  
A5: No, only free licenses are removed, purchased games remain unaffected.

---

## 免责声明 | Disclaimer

本脚本由作者个人开发，仅供辅助管理使用。使用本脚本存在风险，任何损失作者概不负责。请谨慎操作。

This script is developed by the author for personal use only. Use at your own risk. The author is not responsible for any damage or loss caused. Please operate carefully.

---

## 反馈 | Feedback

欢迎在 GitHub 提交 issues 或建议：  
[https://github.com/PeiqiLi-Github/steam-auto-free-license-remover](https://github.com/PeiqiLi-Github/steam-auto-free-license-remover)
