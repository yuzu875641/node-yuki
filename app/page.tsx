'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import type { PageProps } from "next";

// === Invidious Instance List ===
// An array of Invidious instance URLs for fallback in case one fails.
const invidiousInstances = [
  'https://invidious.reallyaweso.me',
  'https://iv.melmac.space',
  'https://inv.vern.cc',
  'https://y.com.sb',
  'https://invidious.nikkosphere.com',
  'https://yt.omada.cafe'
];

// === API Fetch Function with Fallback ===
// This function attempts to fetch data from each Invidious instance until a successful response is received.
async function fetchInvidiousData(path: string, params: URLSearchParams): Promise<any> {
  const query = params.toString();
  for (const instance of invidiousInstances) {
    try {
      const response = await axios.get(`${instance}/api/v1${path}?${query}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch from ${instance}:`, error.message);
    }
  }
  throw new Error('すべてのInvidiousインスタンスで情報を取得できませんでした。');
}

// === Main Component ===
// This is the core component that renders the appropriate UI based on the URL query.
export default function Home({ searchParams }: PageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Safely access search parameters
        const q = searchParams?.q as string;
        const v = searchParams?.v as string;
        const list = searchParams?.list as string;
        const channelid = searchParams?.channelid as string;
        
        if (v) {
          const videoData = await fetchInvidiousData(`/videos/${v}`, new URLSearchParams());
          setData(videoData);
        } else if (q) {
          const searchData = await fetchInvidiousData('/search', new URLSearchParams({ q }));
          setData(searchData);
        } else if (channelid) {
          const channelData = await fetchInvidiousData(`/channels/${channelid}`, new URLSearchParams());
          setData(channelData);
        } else if (list) {
          const playlistData = await fetchInvidiousData(`/playlists/${list}`, new URLSearchParams());
          setData(playlistData);
        } else {
          // No specific query, render the homepage content.
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchParams]);

  // ---

  ### UI Rendering Logic

  const renderContent = () => {
    if (loading) return <div style={{ textAlign: 'center', marginTop: '20px' }}>ローディング中...</div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>エラー: {error}</div>;

    // Video Player Page
    if (searchParams.v && data) {
      const video = data;
      const thumbnailUrl = video?.authorThumbnails?.find((thumb: any) => thumb.width === 100 && thumb.height === 100)?.url;
      const videoUrl = video.formatStreams?.[0]?.url;

      return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {videoUrl && (
            <iframe
              width="100%"
              height="500px"
              src={videoUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
          <h1 style={{ fontSize: '2em' }}>{video.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {thumbnailUrl && <img src={thumbnailUrl} alt={video.author} style={{ borderRadius: '50%', width: '50px', height: '50px' }} />}
            <Link href={`/channel?channelid=${video.authorId}`} style={{ fontWeight: 'bold' }}>{video.author}</Link>
            <span style={{ fontSize: '0.9em', color: '#aaa' }}>{video.viewCount} views</span>
            <span style={{ fontSize: '0.9em', color: '#aaa' }}>{video.likeCount} likes</span>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{video.description}</p>
        </div>
      );
    }

    // Search Results Page
    if (searchParams.q && data) {
      return (
        <div style={{ padding: '20px' }}>
          <h1 style={{ fontSize: '2em' }}>「{searchParams.q}」の検索結果</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {data.map((item: any) => (
              <div key={item.videoId} style={{ backgroundColor: '#282828', borderRadius: '8px', overflow: 'hidden' }}>
                <Link href={`/watch?v=${item.videoId}`}>
                  <img src={item.videoThumbnails?.[0]?.url} alt={item.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  <div style={{ padding: '15px' }}>
                    <h2 style={{ fontSize: '1.2em', margin: '0 0 5px 0' }}>{item.title}</h2>
                    <p style={{ fontSize: '0.9em', color: '#aaa', margin: '0' }}>{item.author}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Homepage with Search Form
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
        <h1 style={{ fontSize: '4em' }}>Yozutube</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }} style={{ width: '80%', maxWidth: '600px', display: 'flex' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="動画を検索..."
            style={{ flexGrow: 1, padding: '10px 15px', borderRadius: '5px 0 0 5px', border: 'none', outline: 'none', fontSize: '1em', backgroundColor: '#333', color: '#fff' }}
          />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: '0 5px 5px 0', border: 'none', backgroundColor: '#ff0000', color: '#fff', cursor: 'pointer', fontSize: '1em' }}>検索</button>
        </form>
      </div>
    );
  };

  return (
    <div>
      <header style={{ backgroundColor: '#1e1e1e', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Yozutube</Link>
        <form onSubmit={(e) => {
          e.preventDefault();
          window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }} style={{ flexGrow: 1, maxWidth: '500px', margin: '0 20px', display: 'flex' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="動画を検索..."
            style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '5px 0 0 5px', border: 'none', outline: 'none', backgroundColor: '#333', color: '#fff' }}
          />
          <button type="submit" style={{ padding: '8px 15px', borderRadius: '0 5px 5px 0', border: 'none', backgroundColor: '#ff0000', color: '#fff', cursor: 'pointer' }}>検索</button>
        </form>
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
}
