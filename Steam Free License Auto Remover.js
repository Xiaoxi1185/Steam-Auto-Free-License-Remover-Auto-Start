// ==UserScript==
// @name         STEAM 一键清库存 Steam Free License Auto Remover
// @namespace    https://github.com/PeiqiLi-Github
// @version      1.0
// @description  本脚本用于清理 Steam 库存，支持一键删除所有免费添加的游戏许可，不会影响已购买的游戏。为避免触发 Steam 限速，默认删除操作间隔为3分钟，建议勿随意缩短。删除的游戏许可通常可通过商店页面重新添加，但部分已下架游戏可能无法恢复。请在使用前确认是否确实需要删除。使用本脚本存在一定风险，操作即视为已了解并接受风险，因脚本导致的任何损失，作者概不负责。
// @author       PeiqiLi
// @match        https://store.steampowered.com/account/licenses/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function insertButton() {
        const titleElem = document.querySelector('.page_content > h2');
        if (!titleElem) {
            console.warn('找不到元素，请检查是否位于https://store.steampowered.com/account/licenses/');
            return;
        }

        const btn = document.createElement('button');
        btn.textContent = '🧹开始清理';
        btn.style.backgroundColor = '#FFD700';
        btn.style.color = '#000';
        btn.style.border = 'none';
        btn.style.padding = '5px 12px';
        btn.style.marginLeft = '15px';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '4px';
        btn.style.fontWeight = 'bold';

        const statusDiv = document.createElement('pre');
        statusDiv.style.border = '1px solid #ccc';
        statusDiv.style.padding = '10px';
        statusDiv.style.marginTop = '10px';
        statusDiv.style.maxHeight = '300px';
        statusDiv.style.overflowY = 'auto';
        statusDiv.style.whiteSpace = 'pre-wrap';
        statusDiv.style.backgroundColor = '#FFD700';
        statusDiv.style.color = '#000';


        btn.addEventListener('click', () => {
            btn.disabled = true;
            statusDiv.textContent = '';
            startCleaning(statusDiv).then(() => {
                statusDiv.textContent += '\n🎉 所有操作完成！\n';
                btn.disabled = false;
            });
        });

        titleElem.parentNode.insertBefore(btn, titleElem.nextSibling);
        titleElem.parentNode.insertBefore(statusDiv, btn.nextSibling);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function scanRemovableGames() {
        const rows = document.querySelectorAll('.account_table tr');
        const games = [];

        rows.forEach(row => {
            const removeLink = row.querySelector('a[href^="javascript:RemoveFreeLicense"]');
            if (removeLink) {
                const cells = row.querySelectorAll('td');
                const itemName = cells[1] ? cells[1].textContent.trim() : '未知游戏名';

                const href = removeLink.getAttribute('href');
                const match = href.match(/RemoveFreeLicense\(\s*(\d+)\s*,/);
                const packageId = match ? match[1] : null;

                if (packageId) {
                    games.push({
                        packageId,
                        itemName,
                        removeLink
                    });
                }
            }
        });

        return games;
    }

    async function removeGame(packageId) {
        try {
            const response = await fetch('https://store.steampowered.com/account/removelicense', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `sessionid=${encodeURIComponent(g_sessionID)}&packageid=${encodeURIComponent(packageId)}`
            });

            if (!response.ok) {
                return { success: false, error: `HTTP状态 ${response.status}` };
            }

            const data = await response.json();
            if (data.success) {
                return { success: true };
            } else {
                return { success: false, error: `返回错误代码: ${data.success}` };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async function startCleaning(statusDiv) {
        const games = scanRemovableGames();
        const total = games.length;

        if (total === 0) {
            statusDiv.textContent = '✅ 没有找到可删除的游戏。';
            return;
        }

        const intervalMs = 3 * 60 * 1000;

        statusDiv.textContent += `🚀 开始自动删除可删除游戏，每个间隔3分钟...\n共找到 ${total} 个可删除游戏\n\n`;

        for (let i = 0; i < total; i++) {
            const g = games[i];
            const percent = ((i) / total * 100).toFixed(2);
            const remainingCount = total - i;
            const remainingTimeMs = remainingCount * intervalMs;
            const remainingMinutes = Math.floor(remainingTimeMs / 60000);
            const remainingSeconds = Math.floor((remainingTimeMs % 60000) / 1000);

            statusDiv.textContent += `🗑️ 正在删除第 ${i + 1} 个游戏：${g.itemName} (包ID: ${g.packageId})\n`;
            statusDiv.textContent += `进度：${i} / ${total} (${percent}%)\n`;
            statusDiv.textContent += `预计剩余时间：${remainingMinutes} min \n`;

            const result = await removeGame(g.packageId);

            if (result.success) {
                statusDiv.textContent += `✅ 删除成功\n\n`;
            } else {
                statusDiv.textContent += `❌ 删除失败，原因：${result.error}\n\n`;
            }

            statusDiv.scrollTop = statusDiv.scrollHeight;

            if (i < total - 1) {
                statusDiv.textContent += `⏳ 等待 3 min 后继续...\n\n`;
                statusDiv.scrollTop = statusDiv.scrollHeight;
                await sleep(intervalMs);
            }
        }
    }

    function waitForPage() {
        return new Promise(resolve => {
            if (document.querySelector('.page_content > h2')) {
                resolve();
            } else {
                const observer = new MutationObserver(() => {
                    if (document.querySelector('.page_content > h2')) {
                        observer.disconnect();
                        resolve();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    }

    waitForPage().then(() => {
        insertButton();
    });
})();
