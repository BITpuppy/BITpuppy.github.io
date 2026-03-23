// ==================== 角色数据 ====================
const sixStarChars = [
    { name: "洛茜", rarity: 6, featured: true },
    { name: "汤汤", rarity: 6, featured: false },
    { name: "伊冯", rarity: 6, featured: false },
    { name: "余烬", rarity: 6, featured: false },
    { name: "黎风", rarity: 6, featured: false },
    { name: "艾尔黛拉", rarity: 6, featured: false },
    { name: "别礼", rarity: 6, featured: false },
    { name: "骏卫", rarity: 6, featured: false }
];
const fiveStarChars = [
    { name: "佩丽卡", rarity: 5, featured: false },
    { name: "弧光", rarity: 5, featured: false },
    { name: "艾维文娜", rarity: 5, featured: false },
    { name: "大潘", rarity: 5, featured: false },
    { name: "陈千语", rarity: 5, featured: false },
    { name: "狼卫", rarity: 5, featured: false },
    { name: "赛希", rarity: 5, featured: false },
    { name: "昼雪", rarity: 5, featured: false },
    { name: "阿列什", rarity: 5, featured: false }
];
const fourStarChars = [
    { name: "秋栗", rarity: 4, featured: false },
    { name: "卡契尔", rarity: 4, featured: false },
    { name: "埃特拉", rarity: 4, featured: false },
    { name: "萤石", rarity: 4, featured: false },
    { name: "安塔尔", rarity: 4, featured: false }
];
const allCharacters = [...sixStarChars, ...fiveStarChars, ...fourStarChars];
const featuredOperator = sixStarChars.find(c => c.featured === true);

// ==================== 卡池状态 ====================
let bannerState = {
    baseRates: { 6: 0.008, 5: 0.08, 4: 0.912 },
    currentRates: { 6: 0.008, 5: 0.08, 4: 0.912 },
    pullCount: 0,
    pity5: 0,
    pity6: 0,
    pityFeatured: 0,
    pityFeaturedAvailable: true,
    rateUpAvailable: false,
    rateUpStart: 65,
    totalPulls: 0,
    pullHistory: [],
    rarityCounts: { 6: 0, 5: 0, 4: 0 },
    featuredCount: 0,
    freeTenPullAvailable: false,
    freeTenPullTriggered: false,
};

// ==================== 辅助函数 ====================
function getNonFeaturedByRarity(rarity) {
    let pool = allCharacters.filter(c => c.rarity === rarity && !c.featured);
    if (pool.length === 0) pool = allCharacters.filter(c => c.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
}

function getAllByRarity(rarity) {
    let pool = allCharacters.filter(c => c.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
}

function calculateCurrentRates(state) {
    let { pity6, rateUpAvailable, rateUpStart, baseRates } = state;
    let newRates = { ...baseRates };
    if (pity6 >= rateUpStart && !rateUpAvailable) {
        state.rateUpAvailable = true;
        let increment = 0.05 * (pity6 - rateUpStart);
        newRates[6] = baseRates[6] + increment;
        newRates[4] = baseRates[4] - increment;
        newRates[5] = baseRates[5];
    } else if (state.rateUpAvailable) {
        let increment = 0.05 * (pity6 - rateUpStart);
        newRates[6] = baseRates[6] + increment;
        newRates[4] = baseRates[4] - increment;
        newRates[5] = baseRates[5];
    } else {
        newRates = { ...baseRates };
    }
    let total = newRates[6] + newRates[5] + newRates[4];
    if (Math.abs(total - 1.0) > 0.0001) newRates[4] += 1.0 - total;
    state.currentRates = newRates;
    return newRates;
}

// ==================== 抽卡核心逻辑 ====================
function performPull(isFreePull = false) {
    if (isFreePull) {
        let rand = Math.random();
        let rarity = 4;
        if (rand < bannerState.baseRates[6]) rarity = 6;
        else if (rand < bannerState.baseRates[6] + bannerState.baseRates[5]) rarity = 5;
        else rarity = 4;
        
        let result = null;
        if (rarity === 6) {
            if (Math.random() < 0.5 && bannerState.pityFeaturedAvailable) {
                result = featuredOperator;
                bannerState.featuredCount++;
            } else {
                result = getNonFeaturedByRarity(6);
            }
        } else {
            result = getAllByRarity(rarity);
        }
        bannerState.totalPulls++;
        bannerState.rarityCounts[rarity]++;
        bannerState.pullHistory.push(result);
        if (bannerState.pullHistory.length > 1000) bannerState.pullHistory.shift();
        return result;
    }
    
    bannerState.pullCount++;
    bannerState.totalPulls++;
    bannerState.pity5++;
    bannerState.pity6++;
    if (bannerState.pityFeaturedAvailable) bannerState.pityFeatured++;
    
    calculateCurrentRates(bannerState);
    let rates = bannerState.currentRates;
    let rand = Math.random();
    let rarity = 4;
    if (rand < rates[6]) rarity = 6;
    else if (rand < rates[6] + rates[5]) rarity = 5;
    else rarity = 4;
    
    if (bannerState.pity6 >= 80) rarity = 6;
    else if (rarity === 4 && bannerState.pity5 >= 10) rarity = 5;
    
    let result = null;
    if (bannerState.pityFeatured >= 120 && bannerState.pityFeaturedAvailable) {
        rarity = 6;
        result = featuredOperator;
        bannerState.featuredCount++;
    } else if (rarity === 6) {
        if (Math.random() < 0.5) {
            result = featuredOperator;
            bannerState.featuredCount++;
        } else {
            result = getNonFeaturedByRarity(6);
        }
    } else {
        result = getAllByRarity(rarity);
    }
    
    if (rarity === 6) {
        bannerState.pity6 = 0;
        bannerState.rateUpAvailable = false;
        if (result === featuredOperator) {
            bannerState.pityFeaturedAvailable = false;
            bannerState.pityFeatured = 0;
        }
    }
    if (rarity >= 5) {
        bannerState.pity5 = 0;
    }
    
    bannerState.rarityCounts[rarity]++;
    bannerState.pullHistory.push(result);
    if (bannerState.pullHistory.length > 1000) bannerState.pullHistory.shift();
    return result;
}

function tenPull() {
    let results = [];
    for (let i = 0; i < 10; i++) {
        results.push(performPull(false));
    }
    return results;
}

function freeTenPull() {
    let results = [];
    for (let i = 0; i < 10; i++) {
        results.push(performPull(true));
    }
    bannerState.freeTenPullAvailable = false;
    return results;
}

function checkFreeTenPullTrigger() {
    if (!bannerState.freeTenPullTriggered && bannerState.totalPulls >= 30) {
        bannerState.freeTenPullAvailable = true;
        bannerState.freeTenPullTriggered = true;
        updateFreeTenButtonUI();
        return true;
    }
    return false;
}

function resetSimulation() {
    bannerState = {
        baseRates: { 6: 0.008, 5: 0.08, 4: 0.912 },
        currentRates: { 6: 0.008, 5: 0.08, 4: 0.912 },
        pullCount: 0,
        pity5: 0,
        pity6: 0,
        pityFeatured: 0,
        pityFeaturedAvailable: true,
        rateUpAvailable: false,
        rateUpStart: 65,
        totalPulls: 0,
        pullHistory: [],
        rarityCounts: { 6: 0, 5: 0, 4: 0 },
        featuredCount: 0,
        freeTenPullAvailable: false,
        freeTenPullTriggered: false,
    };
    const tenBtn = document.getElementById('tenBtn');
    tenBtn.disabled = false;
    tenBtn.textContent = "十连";
    tenBtn.classList.remove('btn-free');
    tenBtn.classList.add('btn-ten');
    const singleBtn = document.getElementById('singleBtn');
    singleBtn.disabled = false;
    updateAllDisplay();
    document.getElementById('resultArea').innerHTML = '<div style="color:#aaa; text-align:center;">已重置，可以重新开始抽卡</div>';
}

// ==================== UI 更新函数 ====================
function updateRatesDisplay() {
    let rates = bannerState.currentRates;
    document.getElementById('rate6').innerText = (rates[6] * 100).toFixed(2) + "%";
    document.getElementById('rate5').innerText = (rates[5] * 100).toFixed(2) + "%";
    document.getElementById('rate4').innerText = (rates[4] * 100).toFixed(2) + "%";
}

function updatePityDisplay() {
    document.getElementById('pity6').innerText = `${bannerState.pity6}/80`;
    document.getElementById('pity5').innerText = `${bannerState.pity5}/10`;
    let limitedMark = bannerState.pityFeaturedAvailable ? "" : "✓";
    document.getElementById('limitedPity').innerHTML = `${bannerState.pityFeatured}/120 ${limitedMark}`;
}

function updateStatsDisplay() {
    document.getElementById('statUp').innerText = bannerState.featuredCount;
    document.getElementById('stat6').innerText = bannerState.rarityCounts[6];
    document.getElementById('stat5').innerText = bannerState.rarityCounts[5];
    document.getElementById('stat4').innerText = bannerState.rarityCounts[4];
    document.getElementById('statTotal').innerText = bannerState.totalPulls;
    if (bannerState.rarityCounts[6] > 0) {
        let avg = (bannerState.totalPulls / bannerState.rarityCounts[6]).toFixed(1);
        document.getElementById('statAvg').innerText = avg + "抽";
    } else {
        document.getElementById('statAvg').innerText = "N/A";
    }
}

function updateHistoryDisplay() {
    let historyBox = document.getElementById('historyBox');
    let recent = bannerState.pullHistory.slice(-100);
    if (recent.length === 0) {
        historyBox.innerHTML = '<div style="color:#aaa; text-align:center;">暂无抽卡记录</div>';
        return;
    }
    let startIdx = Math.max(0, bannerState.pullHistory.length - 100);
    let html = '';
    recent.forEach((char, idx) => {
        let indexNum = startIdx + idx + 1;
        let colorClass = '';
        if (char.rarity === 6) colorClass = 'rarity-6';
        else if (char.rarity === 5) colorClass = 'rarity-5';
        else colorClass = 'rarity-4';
        let upTag = (char.featured && char.rarity === 6) ? '<span class="up-tag">(UP)</span>' : '';
        html += `<div class="history-item">
                    <span class="history-index">[${String(indexNum).padStart(3, '0')}]</span>
                    <span class="${colorClass}">${char.name}</span>${upTag}
                 </div>`;
    });
    historyBox.innerHTML = html;
}

function updateFreeTenButtonUI() {
    const tenBtn = document.getElementById('tenBtn');
    if (bannerState.freeTenPullAvailable) {
        tenBtn.textContent = "🎁 免费十连";
        tenBtn.classList.remove('btn-ten');
        tenBtn.classList.add('btn-free');
        document.getElementById('singleBtn').disabled = true;
    } else {
        tenBtn.textContent = "十连";
        tenBtn.classList.remove('btn-free');
        tenBtn.classList.add('btn-ten');
        document.getElementById('singleBtn').disabled = false;
    }
}

function updateAllDisplay() {
    updateRatesDisplay();
    updatePityDisplay();
    updateStatsDisplay();
    updateHistoryDisplay();
}

// 获取星级对应的颜色
function getRarityColor(rarity) {
    if (rarity === 6) return '#FF8A80';
    if (rarity === 5) return '#FFB74D';
    return '#B39DDB';
}

// 抽取结果显示
function displayPullResult(results, isTenPull = false) {
    let resultArea = document.getElementById('resultArea');
    
    if (!isTenPull) {
        // 单抽结果
        let char = results;
        let color = getRarityColor(char.rarity);
        let upText = (char.featured && char.rarity === 6) ? ' ✨UP✨' : '';
        resultArea.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; min-height: 150px;">
            <div class="result-name" style="background:${color}20; border-left:4px solid ${color};">${char.name}${upText}</div>
        </div>`;
    } else {
        // 十连结果
        let itemsHtml = '<div class="ten-pull-list">';
        results.forEach((char, index) => {
            let color = getRarityColor(char.rarity);
            let borderColor = color;
            let upFlag = (char.featured && char.rarity === 6) ? ' ✨UP' : '';
            itemsHtml += `
                <div class="ten-pull-item" style="border-left-color: ${borderColor};">
                    <span class="ten-pull-number">${index + 1}.</span>
                    <span style="color: ${color}; font-weight: bold;">${char.name}</span>
                    ${upFlag ? '<span style="color: #FFD700; font-size: 0.8rem;">(UP)</span>' : ''}
                </div>
            `;
        });
        itemsHtml += '</div>';
        resultArea.innerHTML = itemsHtml;
        resultArea.scrollTop = 0;
    }
}

// ==================== 业务逻辑 ====================
function singlePull() {
    if (bannerState.freeTenPullAvailable) {
        alert("请先使用免费十连，再继续单抽");
        return;
    }
    let result = performPull(false);
    displayPullResult(result, false);
    updateAllDisplay();
    checkFreeTenPullTrigger();
    updateFreeTenButtonUI();
}

function tenPullHandler() {
    if (bannerState.freeTenPullAvailable) {
        let results = freeTenPull();
        displayPullResult(results, true);
        updateAllDisplay();
        updateFreeTenButtonUI();
        document.getElementById('singleBtn').disabled = false;
    } else {
        let results = tenPull();
        displayPullResult(results, true);
        updateAllDisplay();
        checkFreeTenPullTrigger();
        updateFreeTenButtonUI();
    }
}

// ==================== 初始化角色列表 ====================
function initCharacterList() {
    let sixHtml = sixStarChars.map(c => `<span class="rarity-6">${c.name}</span>${c.featured ? '<span class="up-tag">(UP)</span>' : ''}`).join('  ');
    let fiveHtml = fiveStarChars.map(c => `<span class="rarity-5">${c.name}</span>`).join('  ');
    let fourHtml = fourStarChars.map(c => `<span class="rarity-4">${c.name}</span>`).join('  ');
    document.getElementById('sixStarList').innerHTML = sixHtml;
    document.getElementById('fiveStarList').innerHTML = fiveHtml;
    document.getElementById('fourStarList').innerHTML = fourHtml;
}

// ==================== 绑定事件 ====================
function bindEvents() {
    document.getElementById('singleBtn').addEventListener('click', singlePull);
    document.getElementById('tenBtn').addEventListener('click', tenPullHandler);
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('重置后所有抽卡记录和保底将会清空，确定吗？')) {
            resetSimulation();
            updateFreeTenButtonUI();
        }
    });
}

// ==================== 启动应用 ====================
function main() {
    initCharacterList();
    bindEvents();
    updateAllDisplay();
    updateFreeTenButtonUI();
}

main();