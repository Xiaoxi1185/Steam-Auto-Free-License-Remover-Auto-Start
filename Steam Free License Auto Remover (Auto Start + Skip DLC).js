// ==UserScript==
// @name         STEAM 一键清库存 Steam Free License Auto Remover (Auto Start + Skip DLC)
// @namespace    https://github.com/Xiaoxi1185
// @version      3.4.0
// @description  自动启动，删除失败自动跳过，跳过DLC，无可删除游戏时自动刷新，每小时自动刷新页面，支持暂停功能
// @author       PeiqiLi + Claude Sonnet 4.5
// @match        https://store.steampowered.com/account/licenses/
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置常量 ====================
    const CONFIG = {
        AUTO_REFRESH_INTERVAL: 60 * 60 * 1000, // 1小时自动刷新
        NO_GAMES_REFRESH_DELAY: 5000, // 无游戏时5秒后刷新
        INITIAL_SUCCESS_DELAY: 5 * 60 * 1000, // 成功删除第一个游戏后的延迟：5分钟
        NORMAL_DELAY_RANGE: { min: 500, max: 1500 }, // 正常延迟范围
        DLC_KEYWORDS: [
            'DLC', 'Dlc', 'dlc',
            'Content', 'content',
            'Expansion', 'expansion',
            'Addon', 'addon', 'Add-on',
            'Pack', 'pack',
            'Season Pass', 'season pass',
            'Bundle', 'bundle',
            'Soundtrack', 'soundtrack', 'OST',
            'Artbook', 'artbook',
            '扩展包', '内容', '额外', '外观', '追加', '原声', '音乐'
        ]
    };

    let isFirstSuccess = true; // 标记是否是第一次成功删除游戏
    let isPaused = false; // 标记是否暂停清理操作
    let successCount = 0; // 成功删除计数
    let failCount = 0; // 失败删除计数
    let autoRefreshTimer = null; // 自动刷新定时器

    // ==================== 工具函数 ====================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function randomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 设置自动刷新定时器
    function setupAutoRefresh() {
        clearAutoRefresh();
        autoRefreshTimer = setTimeout(() => {
            console.log('自动刷新：已到1小时，刷新页面');
            location.reload();
        }, CONFIG.AUTO_REFRESH_INTERVAL);
        console.log(`自动刷新已设置，将在 ${new Date(Date.now() + CONFIG.AUTO_REFRESH_INTERVAL).toLocaleString('zh-CN')} 刷新页面`);
    }

    // 清除自动刷新定时器
    function clearAutoRefresh() {
        if (autoRefreshTimer) {
            clearTimeout(autoRefreshTimer);
            autoRefreshTimer = null;
            console.log('自动刷新定时器已清除');
        }
    }

    function insertButton() {
        const titleElem = document.querySelector('.page_content > h2');
        if (!titleElem) {
            console.warn('找不到元素，请检查是否位于 https://store.steampowered.com/account/licenses/');
            return;
        }

        const btnStart = document.createElement('button');
        btnStart.textContent = '开始清理';
        btnStart.style.backgroundColor = '#FFD700';
        btnStart.style.color = '#000';
        btnStart.style.border = 'none';
        btnStart.style.padding = '5px 12px';
        btnStart.style.marginLeft = '15px';
        btnStart.style.cursor = 'pointer';
        btnStart.style.borderRadius = '4px';
        btnStart.style.fontWeight = 'bold';

        const btnPause = document.createElement('button');
        btnPause.textContent = '暂停';
        btnPause.style.backgroundColor = '#FFA500';
        btnPause.style.color = '#000';
        btnPause.style.border = 'none';
        btnPause.style.padding = '5px 12px';
        btnPause.style.marginLeft = '10px';
        btnPause.style.cursor = 'pointer';
        btnPause.style.borderRadius = '4px';
        btnPause.style.fontWeight = 'bold';
        btnPause.disabled = true; // 初始状态为禁用

        const statusDiv = document.createElement('pre');
        statusDiv.style.border = '1px solid #ccc';
        statusDiv.style.padding = '10px';
        statusDiv.style.marginTop = '10px';
        statusDiv.style.maxHeight = '300px';
        statusDiv.style.overflowY = 'auto';
        statusDiv.style.whiteSpace = 'pre-wrap';
        statusDiv.style.backgroundColor = '#FFD700';
        statusDiv.style.color = '#000';

        const refreshInfo = document.createElement('div');
        refreshInfo.style.marginTop = '10px';
        refreshInfo.style.padding = '5px';
        refreshInfo.style.backgroundColor = '#e3f2fd';
        refreshInfo.style.border = '1px solid #90caf9';
        refreshInfo.style.borderRadius = '4px';
        refreshInfo.style.fontSize = '12px';
        refreshInfo.style.color = '#1976d2';

        const nextRefreshTime = new Date(Date.now() + CONFIG.AUTO_REFRESH_INTERVAL);
        refreshInfo.textContent = `下次自动刷新时间：${nextRefreshTime.toLocaleString('zh-CN')}`;

        btnStart.addEventListener('click', async () => {
            btnStart.disabled = true;
            btnPause.disabled = false;
            statusDiv.textContent = '';
            successCount = 0; // 重置计数
            failCount = 0; // 重置计数
            await startCleaning(statusDiv, btnPause);
            statusDiv.textContent += '\n所有操作完成！\n';
            btnStart.disabled = false;
            btnPause.disabled = true;
        });

        btnPause.addEventListener('click', () => {
            isPaused = !isPaused;
            btnPause.textContent = isPaused ? '继续' : '暂停';
            statusDiv.textContent += isPaused ? '\n已暂停清理\n' : '\n已恢复清理\n';
            statusDiv.scrollTop = statusDiv.scrollHeight;
        });

        titleElem.parentNode.insertBefore(btnStart, titleElem.nextSibling);
        titleElem.parentNode.insertBefore(btnPause, btnStart.nextSibling);
        titleElem.parentNode.insertBefore(statusDiv, btnPause.nextSibling);
        titleElem.parentNode.insertBefore(refreshInfo, statusDiv.nextSibling);

        // 启动自动刷新定时器
        setupAutoRefresh();

        // 页面卸载前清理定时器
        window.addEventListener('beforeunload', () => {
            clearAutoRefresh();
        });

        // 自动启动清理
        btnStart.click();
    }

    function scanRemovableGames() {
        const rows = document.querySelectorAll('.account_table tr');
        const games = [];
        const skippedDLCs = [];

        rows.forEach(row => {
            const removeLink = row.querySelector('a[href^="javascript:RemoveFreeLicense"]');
            if (removeLink) {
                const cells = row.querySelectorAll('td');
                const itemName = cells[1]?.textContent.trim() || '未知游戏名';

                const href = removeLink.getAttribute('href');
                const match = href.match(/RemoveFreeLicense\(\s*(\d+)\s*,/);
                const packageId = match?.[1];

                if (packageId) {
                    // 检查是否为 DLC
                    if (CONFIG.DLC_KEYWORDS.some(keyword => itemName.includes(keyword))) {
                        skippedDLCs.push({ packageId, itemName });
                    } else {
                        games.push({ packageId, itemName });
                    }
                }
            }
        });

        return { games, skippedDLCs };
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
            if (data.success === 1) {
                return { success: true };
            }

            return { success: false, error: `返回错误代码: ${data.success}` };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async function startCleaning(statusDiv, btnPause) {
        const { games, skippedDLCs } = scanRemovableGames();
        const total = games.length;

        statusDiv.textContent += `扫描完成：\n`;
        statusDiv.textContent += `可删除游戏：${total} 个\n`;
        statusDiv.textContent += `跳过DLC：${skippedDLCs.length} 个\n\n`;

        if (skippedDLCs.length > 0) {
            statusDiv.textContent += `已跳过以下DLC：\n`;
            skippedDLCs.slice(0, 5).forEach(dlc => {
                statusDiv.textContent += `  - ${dlc.itemName}\n`;
            });
            if (skippedDLCs.length > 5) {
                statusDiv.textContent += `  ... 还有 ${skippedDLCs.length - 5} 个DLC\n`;
            }
            statusDiv.textContent += `\n`;
        }

        if (total === 0) {
            statusDiv.textContent += '没有找到可删除的游戏（非DLC）。\n5秒后自动刷新页面...\n';
            clearAutoRefresh(); // 清除定时器，因为即将手动刷新
            await sleep(CONFIG.NO_GAMES_REFRESH_DELAY);
            location.reload();
            return;
        }

        statusDiv.textContent += `开始自动删除游戏...\n\n`;

        for (let i = 0; i < total; i++) {
            const game = games[i];
            statusDiv.textContent += `正在删除第 ${i + 1} 个游戏：${game.itemName} (包ID: ${game.packageId})\n`;
            statusDiv.textContent += `进度：${i + 1} / ${total} (${(((i + 1) / total) * 100).toFixed(2)}%)\n`;
            statusDiv.textContent += `成功：${successCount} | 失败：${failCount}\n`;

            const result = await removeGame(game.packageId);

            if (result.success) {
                successCount++;
                statusDiv.textContent += `删除成功\n`;

                // 如果是第一个成功的游戏，等待5分钟
                if (isFirstSuccess) {
                    isFirstSuccess = false;
                    statusDiv.textContent += `删除第一个游戏成功，等待 5 分钟后继续...\n\n`;
                    await sleep(CONFIG.INITIAL_SUCCESS_DELAY);
                }
            } else {
                failCount++;
                statusDiv.textContent += `删除失败，原因：${result.error}\n`;
                statusDiv.textContent += `跳过该游戏，继续下一个...\n\n`;
            }

            statusDiv.scrollTop = statusDiv.scrollHeight;

            // 检查是否暂停
            while (isPaused) {
                await sleep(1000); // 每秒检查是否恢复
            }

            // 如果不是最后一个游戏，等待随机延迟
            if (i < total - 1) {
                const delay = randomDelay(CONFIG.NORMAL_DELAY_RANGE.min, CONFIG.NORMAL_DELAY_RANGE.max);
                statusDiv.textContent += `等待 ${Math.floor(delay / 1000)} 秒后继续...\n\n`;
                await sleep(delay);
            }
        }

        statusDiv。textContent += `\n统计信息：\n`;
        statusDiv。textContent += `总计：${total} | 成功：${successCount} | 失败：${failCount}\n`;
        statusDiv。textContent += `保护的DLC：${skippedDLCs。length} 个\n`;
        statusDiv。textContent += `所有操作完成！\n`;
        btnPause。disabled = true; // 禁用暂停按钮
    }

    function waitForPage() {
        return new Promise(resolve => {
            if (document。querySelector('.page_content > h2')) {
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
