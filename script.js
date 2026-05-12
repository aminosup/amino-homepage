const VERSION = "v1.0.6";
const VERSION_HISTORY = [
  { version: "v1.0.6", date: "2026/05/12", details: "電光掲示板の文字色を変更できるカラーボールUIを追加" },
  { version: "v1.0.5", date: "2026/05/12", details: "BTCニュースの電光掲示板（マーキー）機能を追加" },
  { version: "v1.0.4", date: "2026/05/11", details: "APIのレートリミット対策としてリクエスト間に1秒の待機処理を追加" },
  { version: "v1.0.3", date: "2026/04/10", details: "APIエラー取得時の例外処理を追加（TypeError修正）" },
  { version: "v1.0.2", date: "2026/04/10", details: "UIデザインの大幅刷新（グラスモフィズム、アニメーション、モダンフォント採用）" },
  { version: "v1.0.1", date: "2026/04/10", details: "クリアボタン追加、バージョン管理機能、検索期間表示機能の追加" },
  { version: "v1.0.0", date: "2026/04/01", details: "新規作成" }
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function isWithinLastTwoDays(pubDateStr) {
  const pubDate = new Date(pubDateStr);
  const now = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(now.getDate() - 2);
  return pubDate >= twoDaysAgo && pubDate <= now;
}

function clearResults() {
  document.getElementById('results').innerHTML = '';
  document.getElementById('searchPeriod').textContent = '';
}

function toggleVersionHistory() {
  const modal = document.getElementById('versionModal');
  if (modal.style.display === 'block') {
    modal.style.display = 'none';
  } else {
    const historyList = document.getElementById('versionHistory');
    historyList.innerHTML = VERSION_HISTORY.map(item => 
      `<li><strong>${item.version}</strong> (${item.date}): ${item.details}</li>`
    ).join('');
    modal.style.display = 'block';
  }
}

// 画面外クリックでモーダルを閉じる
window.onclick = function(event) {
  const modal = document.getElementById('versionModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}

async function searchNews() {
  const input = document.getElementById('categoryInput').value;
  const categories = input.split(',').map(c => c.trim());
  const resultsDiv = document.getElementById('results');
  const periodDiv = document.getElementById('searchPeriod');
  
  resultsDiv.innerHTML = '検索中...';

  // 期間計算
  const now = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(now.getDate() - 2);
  const formatDate = (d) => `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
  periodDiv.textContent = `期間：${formatDate(twoDaysAgo)} ～ ${formatDate(now)}`;

  resultsDiv.innerHTML = '';

  for (const category of categories) {
    const titleElem = document.createElement('div');
    titleElem.className = 'category-title';
    titleElem.textContent = `---------- ${category} --------------`;
    resultsDiv.appendChild(titleElem);

    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(category)}&hl=ja&gl=JP&ceid=JP:ja`;

    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
      const data = await response.json();
      
      if (data.status !== 'ok' || !data.items) {
        throw new Error(data.message || 'ニュースデータの取得に失敗しました');
      }

      const items = data.items.filter(item => isWithinLastTwoDays(item.pubDate)).slice(0, 5);

      if (items.length === 0) {
        const noResult = document.createElement('div');
        noResult.textContent = "該当期間のニュースが見つかりませんでした。";
        resultsDiv.appendChild(noResult);
      } else {
        items.forEach((item, index) => {
          const div = document.createElement('div');
          div.className = 'news-item';
          div.innerHTML = `<span class="news-index">${index + 1}</span><a href="${item.link}" target="_blank">${item.title}</a>`;
          resultsDiv.appendChild(div);
        });
      }

    } catch (error) {
      const errDiv = document.createElement('div');
      errDiv.textContent = `取得失敗: ${error}`;
      resultsDiv.appendChild(errDiv);
    }
    
    // APIレートリミット対策: 次のリクエストの前に1秒待機
    await sleep(1000);
  }
}

// 画面読み込み時に電光掲示板用のBTCニュースを取得
window.addEventListener('DOMContentLoaded', fetchBtcTicker);

async function fetchBtcTicker() {
  const tickerElem = document.getElementById('btcTicker');
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent('BTC')}&hl=ja&gl=JP&ceid=JP:ja`;
  
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
    const data = await response.json();
    
    if (data.status === 'ok' && data.items) {
      // 取得したニュースタイトルを「／」で繋いで一つの文字列にする
      const titles = data.items.slice(0, 5).map(item => item.title).join('　／　');
      tickerElem.textContent = titles || '最近のBTCニュースはありません';
    } else {
      tickerElem.textContent = 'BTCニュースの取得に失敗しました';
    }
  } catch (error) {
    tickerElem.textContent = 'BTCニュースの取得に失敗しました';
  }
}

// 電光掲示板の文字色を変更する関数
function changeTickerColor(color) {
  document.documentElement.style.setProperty('--ticker-color', color);
}