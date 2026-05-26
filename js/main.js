// グローバル変数
let array = [];
let searchValue = null;
let isSearching = false;
let isPaused = false;
let currentIndex = 0;
let comparisonCount = 0;
let speed = 800;
let currentAlgorithm = 'linear'; // 'linear' or 'binary'
let binaryState = { left: 0, right: 0, mid: 0 }; // 二分探索の状態
let chart = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    generateRandomArray();
    updateSpeedDisplay();
    createChart();
    
    // スライダーイベント
    document.getElementById('array-size-slider').addEventListener('input', function(e) {
        document.getElementById('array-size-value').textContent = e.target.value;
        generateRandomArray();
        updateChartInfo();
    });
    
    document.getElementById('speed-slider').addEventListener('input', function(e) {
        speed = parseInt(e.target.value);
        updateSpeedDisplay();
    });
});

// アルゴリズム選択
function selectAlgorithm(algorithm) {
    currentAlgorithm = algorithm;
    
    // タブの切り替え
    document.getElementById('linear-tab').classList.toggle('active', algorithm === 'linear');
    document.getElementById('binary-tab').classList.toggle('active', algorithm === 'binary');
    
    // 情報の切り替え
    document.getElementById('linear-info').classList.toggle('active', algorithm === 'linear');
    document.getElementById('binary-info').classList.toggle('active', algorithm === 'binary');
    
    // 二分探索の場合は配列をソート
    if (algorithm === 'binary') {
        array.sort((a, b) => a - b);
        document.getElementById('sort-status').classList.remove('hidden');
    } else {
        document.getElementById('sort-status').classList.add('hidden');
    }
    
    // 探索中でなければリセット
    if (!isSearching) {
        resetSearch();
        renderArray();
    }
}

// 配列生成
function generateRandomArray() {
    const size = parseInt(document.getElementById('array-size-slider').value);
    array = [];
    for (let i = 0; i < size; i++) {
        array.push(Math.floor(Math.random() * 100));
    }
    
    // 二分探索モードの場合はソート
    if (currentAlgorithm === 'binary') {
        array.sort((a, b) => a - b);
    }
    
    resetSearch();
    renderArray();
    updateChartInfo();
}

// 配列編集
function editArray() {
    const input = prompt('配列の値をカンマ区切りで入力してください:', array.join(', '));
    if (input) {
        const newArray = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (newArray.length > 0) {
            array = newArray;
            
            // 二分探索モードの場合はソート
            if (currentAlgorithm === 'binary') {
                array.sort((a, b) => a - b);
            }
            
            document.getElementById('array-size-slider').value = array.length;
            document.getElementById('array-size-value').textContent = array.length;
            resetSearch();
            renderArray();
            updateChartInfo();
        }
    }
}

// 配列描画
function renderArray() {
    const container = document.getElementById('array-container');
    container.innerHTML = '';
    
    // 配列サイズに応じてクラスを追加
    if (array.length >= 30) {
        container.classList.add('xlarge-array');
        container.classList.remove('large-array');
    } else if (array.length >= 20) {
        container.classList.add('large-array');
        container.classList.remove('xlarge-array');
    } else {
        container.classList.remove('large-array', 'xlarge-array');
    }
    
    array.forEach((value, index) => {
        const card = document.createElement('div');
        card.className = 'array-card';
        card.id = `card-${index}`;
        
        // 二分探索の範囲表示
        if (currentAlgorithm === 'binary' && isSearching) {
            if (index === binaryState.left) {
                card.classList.add('binary-left');
            }
            if (index === binaryState.right) {
                card.classList.add('binary-right');
            }
            if (index === binaryState.mid) {
                card.classList.add('binary-mid');
            }
            // 範囲外
            if (index < binaryState.left || index > binaryState.right) {
                card.classList.add('binary-out-of-range');
            }
        }
        
        card.innerHTML = `
            <div class="card-value">${value}</div>
            <div class="card-index">index: ${index}</div>
        `;
        container.appendChild(card);
    });
}

// 探索開始
async function startSearch() {
    const input = document.getElementById('search-value').value;
    if (input === '') {
        alert('探索する値を入力してください');
        return;
    }
    
    searchValue = parseInt(input);
    isSearching = true;
    isPaused = false;
    currentIndex = 0;
    comparisonCount = 0;
    
    // 二分探索の初期化
    if (currentAlgorithm === 'binary') {
        binaryState = { left: 0, right: array.length - 1, mid: 0 };
    }
    
    // UI更新
    document.getElementById('start-btn').disabled = true;
    document.getElementById('step-btn').disabled = true;
    document.getElementById('reset-btn').disabled = false;
    document.getElementById('realtime-analysis').classList.remove('hidden');
    document.getElementById('result-section').classList.add('hidden');
    
    // 探索実行
    if (currentAlgorithm === 'linear') {
        await linearSearch();
    } else {
        await binarySearch();
    }
}

// 線形探索
async function linearSearch() {
    for (let i = 0; i < array.length; i++) {
        if (!isSearching) return;
        
        currentIndex = i;
        comparisonCount++;
        
        // カードをハイライト
        const card = document.getElementById(`card-${i}`);
        card.classList.add('checking');
        
        updateRealtimeAnalysis(i, false);
        
        await sleep(speed);
        
        if (array[i] === searchValue) {
            // 発見
            card.classList.remove('checking');
            card.classList.add('found');
            showResult(true, i);
            isSearching = false;
            enableButtons();
            return;
        } else {
            // 不一致
            card.classList.remove('checking');
            card.classList.add('checked');
        }
    }
    
    // 見つからなかった
    showResult(false, -1);
    isSearching = false;
    enableButtons();
}

// 二分探索
async function binarySearch() {
    let left = 0;
    let right = array.length - 1;
    
    while (left <= right) {
        if (!isSearching) return;
        
        const mid = Math.floor((left + right) / 2);
        binaryState = { left, right, mid };
        comparisonCount++;
        
        // 配列を再描画して範囲を表示
        renderArray();
        
        // 中央の要素をハイライト
        const card = document.getElementById(`card-${mid}`);
        card.classList.add('checking');
        
        updateRealtimeAnalysis(mid, false);
        
        await sleep(speed);
        
        if (array[mid] === searchValue) {
            // 発見
            card.classList.remove('checking');
            card.classList.add('found');
            showResult(true, mid);
            isSearching = false;
            enableButtons();
            return;
        } else if (array[mid] < searchValue) {
            // 右半分を探索
            card.classList.remove('checking');
            card.classList.add('checked');
            left = mid + 1;
        } else {
            // 左半分を探索
            card.classList.remove('checking');
            card.classList.add('checked');
            right = mid - 1;
        }
        
        await sleep(300); // 範囲の変化を見せる
    }
    
    // 見つからなかった
    showResult(false, -1);
    isSearching = false;
    enableButtons();
}

// ステップ実行
function stepSearch() {
    // この機能は自動実行と同じロジックだが、手動で進める
    // 簡略化のため、ここでは省略（必要に応じて実装可能）
}

// リセット
function resetSearch() {
    isSearching = false;
    isPaused = false;
    currentIndex = 0;
    comparisonCount = 0;
    binaryState = { left: 0, right: 0, mid: 0 };
    
    document.getElementById('start-btn').disabled = false;
    document.getElementById('step-btn').disabled = false;
    document.getElementById('reset-btn').disabled = true;
    document.getElementById('realtime-analysis').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
    
    // カードの状態をリセット
    document.querySelectorAll('.array-card').forEach(card => {
        card.classList.remove('checking', 'checked', 'found', 'binary-left', 'binary-right', 'binary-mid', 'binary-out-of-range');
    });
    
    renderArray();
}

// リアルタイム分析更新
function updateRealtimeAnalysis(index, found) {
    const caseInfo = determineCase(index, found);
    
    document.getElementById('current-case').textContent = caseInfo.icon + ' ' + caseInfo.type;
    document.getElementById('current-case').className = 'value ' + caseInfo.color;
    
    document.getElementById('comparison-count').textContent = comparisonCount + '回';
    
    const progress = currentAlgorithm === 'linear' 
        ? ((index + 1) / array.length * 100).toFixed(1)
        : ((comparisonCount / Math.ceil(Math.log2(array.length))) * 100).toFixed(1);
    document.getElementById('search-progress').textContent = progress + '%';
    
    const efficiency = ((comparisonCount / array.length) * 100).toFixed(1);
    document.getElementById('efficiency').textContent = efficiency + '%';
    
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = progress + '%';
    progressFill.className = 'progress-fill ' + caseInfo.color;
    
    document.getElementById('status-message').textContent = caseInfo.message;
}

// ケース判定
function determineCase(index, found) {
    if (currentAlgorithm === 'linear') {
        const position = index / (array.length - 1);
        
        if (index === 0) {
            return {
                type: '最良ケース',
                color: 'best',
                icon: '🟢',
                message: '🎉 素晴らしい！先頭で見つかりました！'
            };
        } else if (position >= 0.35 && position <= 0.65) {
            return {
                type: '平均ケース',
                color: 'average',
                icon: '🟡',
                message: '📊 これは平均的なケースです'
            };
        } else if (index === array.length - 1 || !found) {
            return {
                type: '最悪ケース',
                color: 'worst',
                icon: '🔴',
                message: '⚠️ これは最悪ケースです'
            };
        } else if (position < 0.35) {
            return {
                type: '最良に近いケース',
                color: 'best',
                icon: '🟢',
                message: '✨ 早めに見つかりました！'
            };
        } else {
            return {
                type: '最悪に近いケース',
                color: 'worst',
                icon: '🔴',
                message: '🔍 もう少しで完了します'
            };
        }
    } else {
        // 二分探索
        const maxComparisons = Math.ceil(Math.log2(array.length));
        
        if (comparisonCount === 1) {
            return {
                type: '最良ケース',
                color: 'best',
                icon: '🟢',
                message: '🎉 中央で一発で見つかりました！'
            };
        } else if (comparisonCount <= maxComparisons * 0.6) {
            return {
                type: '良好なケース',
                color: 'average',
                icon: '🟡',
                message: '✨ 効率的に探索中です'
            };
        } else {
            return {
                type: '平均的なケース',
                color: 'average',
                icon: '🟡',
                message: '📊 典型的な二分探索の動作です'
            };
        }
    }
}

// 結果表示
function showResult(found, index) {
    const resultSection = document.getElementById('result-section');
    const resultContent = document.getElementById('result-content');
    
    resultSection.classList.remove('hidden');
    
    if (found) {
        const caseInfo = determineFinalCase(index, array.length);
        const efficiency = ((comparisonCount / array.length) * 100).toFixed(1);
        
        resultContent.innerHTML = `
            <div class="result-success">
                <h3>${caseInfo.icon} ${caseInfo.type}！値 ${searchValue} が見つかりました！</h3>
                <div class="result-details">
                    <h4>📊 詳細分析:</h4>
                    <ul>
                        <li>✅ 位置: index ${index}</li>
                        <li>✅ 比較回数: ${comparisonCount}回</li>
                        <li>✅ 配列サイズ: ${array.length}要素</li>
                        <li>✅ 探索効率: ${efficiency}%</li>
                        <li>✅ 計算量: ${caseInfo.complexity}</li>
                        <li>✅ アルゴリズム: ${currentAlgorithm === 'linear' ? '線形探索' : '二分探索'}</li>
                    </ul>
                    <div class="learning-point">
                        <h4>💡 学習ポイント:</h4>
                        <p>${caseInfo.learningPoint}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        const maxComparisons = currentAlgorithm === 'linear' ? array.length : Math.ceil(Math.log2(array.length));
        const efficiency = ((comparisonCount / array.length) * 100).toFixed(1);
        
        resultContent.innerHTML = `
            <div class="result-failure">
                <h3>⚠️ 最悪ケース！値 ${searchValue} は見つかりませんでした</h3>
                <div class="result-details">
                    <h4>📊 詳細分析:</h4>
                    <ul>
                        <li>✅ 比較回数: ${comparisonCount}回（${currentAlgorithm === 'linear' ? '全要素を確認' : '最大回数'}）</li>
                        <li>✅ 配列サイズ: ${array.length}要素</li>
                        <li>✅ 探索効率: ${efficiency}%</li>
                        <li>✅ 計算量: O(${currentAlgorithm === 'linear' ? 'n' : 'log n'}) - ${currentAlgorithm === 'linear' ? '線形時間' : '対数時間'}</li>
                        <li>✅ アルゴリズム: ${currentAlgorithm === 'linear' ? '線形探索' : '二分探索'}</li>
                    </ul>
                    <div class="learning-point">
                        <h4>💡 学習ポイント:</h4>
                        <p>値が存在しない場合は最悪ケースとなり、${currentAlgorithm === 'linear' ? '配列の全要素' : '最大log₂n回'}を確認する必要があります。
                        ${currentAlgorithm === 'binary' ? 'しかし、二分探索ではたった' + comparisonCount + '回で済みました！' : '配列サイズが2倍になると、比較回数も2倍になります！'}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// 最終ケース判定
function determineFinalCase(foundIndex, arrayLength) {
    if (currentAlgorithm === 'linear') {
        const position = foundIndex / (arrayLength - 1);
        
        if (foundIndex === 0) {
            return {
                type: '最良ケース',
                color: 'best',
                icon: '🟢',
                complexity: 'O(1) - 定数時間',
                learningPoint: '最良ケースでは、配列サイズに関係なく常に1回の比較で見つかります。これが最も効率的な状況です！'
            };
        } else if (position >= 0.35 && position <= 0.65) {
            return {
                type: '平均ケース',
                color: 'average',
                icon: '🟡',
                complexity: 'O(n/2) ≈ O(n) - 線形時間',
                learningPoint: '配列の中央付近で見つかった場合は平均ケースです。統計的には約n/2回の比較が必要です。'
            };
        } else {
            return {
                type: '最悪に近いケース',
                color: 'worst',
                icon: '🔴',
                complexity: 'O(n) - 線形時間',
                learningPoint: '配列の後半で見つかった場合、多くの比較が必要です。配列サイズが大きくなるほど影響が大きくなります。'
            };
        }
    } else {
        // 二分探索
        if (comparisonCount === 1) {
            return {
                type: '最良ケース',
                color: 'best',
                icon: '🟢',
                complexity: 'O(1) - 定数時間',
                learningPoint: '最良ケースでは、中央の要素が目的の値で、1回の比較で完了しました！'
            };
        } else {
            return {
                type: '平均〜最悪ケース',
                color: 'average',
                icon: '🟡',
                complexity: 'O(log n) - 対数時間',
                learningPoint: `二分探索では、毎回範囲を半分にするため、たった${comparisonCount}回の比較で済みました。線形探索なら最大${arrayLength}回必要だったところです！`
            };
        }
    }
}

// デモ機能
function demoBestCase() {
    if (currentAlgorithm === 'linear') {
        document.getElementById('search-value').value = array[0];
    } else {
        const mid = Math.floor(array.length / 2);
        document.getElementById('search-value').value = array[mid];
    }
    startSearch();
}

function demoAverageCase() {
    const mid = Math.floor(array.length / 2);
    document.getElementById('search-value').value = array[mid];
    startSearch();
}

function demoWorstCase() {
    let maxValue = Math.max(...array);
    document.getElementById('search-value').value = maxValue + 10;
    startSearch();
}

// アルゴリズム比較
async function compareAlgorithms() {
    const input = document.getElementById('search-value').value;
    if (input === '') {
        alert('探索する値を入力してください');
        return;
    }
    
    const value = parseInt(input);
    const originalAlgorithm = currentAlgorithm;
    
    // 配列をソート（二分探索用）
    const sortedArray = [...array].sort((a, b) => a - b);
    
    // 線形探索
    let linearComparisons = 0;
    let linearFound = false;
    let linearIndex = -1;
    for (let i = 0; i < array.length; i++) {
        linearComparisons++;
        if (array[i] === value) {
            linearFound = true;
            linearIndex = i;
            break;
        }
    }
    
    // 二分探索
    let binaryComparisons = 0;
    let binaryFound = false;
    let binaryIndex = -1;
    let left = 0;
    let right = sortedArray.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        binaryComparisons++;
        if (sortedArray[mid] === value) {
            binaryFound = true;
            binaryIndex = mid;
            break;
        } else if (sortedArray[mid] < value) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    // 結果表示
    const resultDiv = document.getElementById('comparison-result');
    resultDiv.classList.remove('hidden');
    
    const ratio = (linearComparisons / binaryComparisons).toFixed(1);
    
    resultDiv.innerHTML = `
        <h3>🔬 アルゴリズム比較結果</h3>
        <div class="comparison-grid">
            <div class="comparison-item linear">
                <h4>📝 線形探索（Linear Search）</h4>
                <p class="comparison-stat">比較回数: <strong>${linearComparisons}回</strong></p>
                <p class="comparison-stat">結果: ${linearFound ? '✅ 発見（index ' + linearIndex + '）' : '❌ 見つからず'}</p>
                <p class="comparison-stat">計算量: <strong>O(n)</strong></p>
            </div>
            <div class="comparison-item binary">
                <h4>🎯 二分探索（Binary Search）</h4>
                <p class="comparison-stat">比較回数: <strong>${binaryComparisons}回</strong></p>
                <p class="comparison-stat">結果: ${binaryFound ? '✅ 発見（index ' + binaryIndex + '）' : '❌ 見つからず'}</p>
                <p class="comparison-stat">計算量: <strong>O(log n)</strong></p>
            </div>
        </div>
        <div class="comparison-conclusion">
            <p class="highlight">⚡ 二分探索は<strong>${ratio}倍</strong>効率的でした！</p>
            <p class="note">💡 配列サイズ${array.length}要素の場合、二分探索は${linearComparisons - binaryComparisons}回少ない比較で済みました。</p>
            <p class="note">配列サイズが大きくなるほど、この差はさらに顕著になります！</p>
        </div>
    `;
}

// チャート作成
function createChart() {
    const ctx = document.getElementById('complexityChart').getContext('2d');
    
    const sizes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const linearData = sizes.map(n => n);
    const binaryData = sizes.map(n => Math.ceil(Math.log2(n)));
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sizes,
            datasets: [
                {
                    label: '線形探索 O(n)',
                    data: linearData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    tension: 0.1
                },
                {
                    label: '二分探索 O(log n)',
                    data: binaryData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 3,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: '配列サイズと比較回数の関係（最悪ケース）',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '比較回数'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '配列サイズ（要素数）'
                    }
                }
            }
        }
    });
}

// チャート情報更新
function updateChartInfo() {
    const size = array.length;
    const linearWorst = size;
    const binaryWorst = Math.ceil(Math.log2(size));
    const efficiency = (linearWorst / binaryWorst).toFixed(1);
    
    document.getElementById('current-size').textContent = size;
    document.getElementById('linear-worst').textContent = linearWorst;
    document.getElementById('binary-worst').textContent = binaryWorst;
    document.getElementById('efficiency-diff').textContent = efficiency;
}

// ユーティリティ
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateSpeedDisplay() {
    document.getElementById('speed-value').textContent = speed + 'ms';
}

function enableButtons() {
    document.getElementById('start-btn').disabled = false;
    document.getElementById('step-btn').disabled = false;
    document.getElementById('reset-btn').disabled = false;
}
