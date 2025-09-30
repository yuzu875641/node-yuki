const express = require('express');
const { Innertube } = require('youtubei.js');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());

// InvidiousインスタンスのURLリスト
const invidiousInstances = [
  'https://invidious.reallyaweso.me',
  'https://iv.melmac.space',
  'https://inv.vern.cc',
  'https://y.com.sb',
  'https://invidious.nikkosphere.com',
  'https://yt.omada.cafe'
];

// 動作するInvidiousインスタンスを見つける関数
async function getWorkingInvidiousInstance() {
  for (const instance of invidiousInstances) {
    try {
      await axios.get(`${instance}/api/v1/trending`, { timeout: 5000 });
      return instance;
    } catch (error) {
      console.log(`インスタンス ${instance} は利用できません。`);
    }
  }
  return null;
}

// HTMLテンプレートを生成する関数
function createHtml(bodyContent, scriptContent) {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Node-Yuki</title>
        <style>
            body { font-family: sans-serif; max-width: 800px; margin: auto; padding: 20px; }
            input, button { padding: 10px; margin: 5px; }
            #results, #video-player { margin-top: 20px; }
            .video-item { border-bottom: 1px solid #ccc; padding: 10px 0; display: flex; align-items: center; }
            .video-item img { margin-right: 15px; }
            .video-item h3 { margin: 0; }
            #video-details { padding: 15px; border: 1px solid #ddd; }
            #video-details video { max-width: 100%; }
        </style>
    </head>
    <body>
        <h1>Node-Yuki で動画検索</h1>
        <input type="text" id="search-query" placeholder="検索キーワードを入力">
        <button id="search-button">検索</button>
        ${bodyContent}
        <script>
            ${scriptContent}
        </script>
    </body>
    </html>
  `;
}

// ルート: トップページ
app.get('/', (req, res) => {
  const htmlContent = createHtml('<div id="results"></div>', `
    document.getElementById('search-button').addEventListener('click', () => {
        const query = document.getElementById('search-query').value;
        window.location.href = \`/search?q=\${encodeURIComponent(query)}\`;
    });
  `);
  res.send(htmlContent);
});

// ルート: 検索
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.redirect('/');
  }

  try {
    const youtube = await new Innertube();
    const searchResults = await youtube.search(query);
    
    let resultsHtml = `<div id="results">`;
    if (searchResults.videos.length === 0) {
      resultsHtml += `<p>動画が見つかりませんでした。</p>`;
    } else {
      searchResults.videos.forEach(video => {
        resultsHtml += `
          <div class="video-item">
              <img src="${video.thumbnails[0].url}" alt="サムネイル">
              <div>
                  <h3><a href="/watch?v=${video.id}">${video.title.text}</a></h3>
                  <p>${video.author.name} | ${video.view_count.text} views</p>
              </div>
          </div>
        `;
      });
    }
    resultsHtml += `</div>`;
    
    const htmlContent = createHtml(resultsHtml);
    res.send(htmlContent);
  } catch (error) {
    console.error('検索中にエラーが発生しました:', error);
    res.status(500).send('検索に失敗しました。');
  }
});

// ルート: 動画視聴ページ
app.get('/watch', async (req, res) => {
  const videoId = req.query.v;
  if (!videoId) {
    return res.redirect('/');
  }

  const invidiousUrl = await getWorkingInvidiousInstance();
  if (!invidiousUrl) {
    return res.status(503).send('Invidiousインスタンスが利用できません。');
  }

  try {
    const response = await axios.get(`${invidiousUrl}/api/v1/videos/${videoId}`);
    const videoData = response.data;
    
    const videoPlayerHtml = `
      <div id="video-player">
          <h2>${videoData.title}</h2>
          <p><strong>投稿者:</strong> ${videoData.author}</p>
          <p><strong>再生回数:</strong> ${videoData.view_count}</p>
          <video controls src="${videoData.formatStreams[0].url}" style="width:100%"></video>
          <h3>説明</h3>
          <p>${videoData.description}</p>
      </div>
    `;
    
    const htmlContent = createHtml(videoPlayerHtml, `
        document.getElementById('search-button').addEventListener('click', () => {
            const query = document.getElementById('search-query').value;
            window.location.href = \`/search?q=\${encodeURIComponent(query)}\`;
        });
    `);
    res.send(htmlContent);
  } catch (error) {
    console.error('動画情報の取得に失敗しました:', error);
    res.status(500).send('動画情報の取得に失敗しました。');
  }
});

app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});
