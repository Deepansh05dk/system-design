import { useState } from 'react';
import Widget from './Widget';

const BLOCK_MB = 4;
const BLOCKS = 12; // 48 MB file

function hashLabel(seed: number, version: number) {
  const x = Math.abs(Math.sin(seed * 97.13 + version * 13.7) * 1e6);
  return Math.floor(x).toString(16).slice(0, 4);
}

export default function ChunkSyncSim() {
  const [versions, setVersions] = useState<number[]>(Array(BLOCKS).fill(0));
  const [server, setServer] = useState<number[]>(Array(BLOCKS).fill(0));
  const [chunked, setChunked] = useState(true);
  const [last, setLast] = useState<{ mb: number; blocks: number } | null>(null);
  const [total, setTotal] = useState(0);

  const edit = () => {
    const i = Math.floor(Math.random() * BLOCKS);
    setVersions((v) => v.map((x, j) => (j === i ? x + 1 : x)));
  };

  const sync = () => {
    const changed = versions.map((v, i) => v !== server[i]).filter(Boolean).length;
    const mb = chunked ? changed * BLOCK_MB : changed ? BLOCKS * BLOCK_MB : 0;
    setLast({ mb, blocks: chunked ? changed : changed ? BLOCKS : 0 });
    setTotal((t) => t + mb);
    setServer(versions);
  };

  const dirty = versions.map((v, i) => v !== server[i]);

  return (
    <Widget title="Sync a 48 MB file after a small edit" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={!chunked ? 'on' : ''} onClick={() => setChunked(false)}>
            Upload whole file
          </button>
          <button className={chunked ? 'on' : ''} onClick={() => setChunked(true)}>
            Chunked (4 MB blocks)
          </button>
        </div>
        <button className="btn" onClick={edit}>
          ✏️ Edit a small part of the file
        </button>
        <button className="btn btn-primary" onClick={sync}>
          ☁️ Sync
        </button>
      </div>
      <div className="box">
        <div className="box-title">Your file, split into blocks (label = content hash)</div>
        <div className="cs-blocks">
          {versions.map((v, i) => (
            <div key={i} className={`cs-block ${dirty[i] ? 'dirty' : ''}`}>
              <small>#{i + 1}</small>
              <code>{hashLabel(i, v)}</code>
            </div>
          ))}
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>
          Orange blocks changed since the last sync. The client compares block hashes with the server’s list.
        </div>
      </div>
      {last && (
        <div className={`result-banner ${last.mb <= 8 ? 'good' : 'warn'}`}>
          Last sync uploaded <b>{last.mb} MB</b> ({last.blocks} block{last.blocks === 1 ? '' : 's'}). Total uploaded so far: {total} MB.
          {!chunked && last.mb > 0 && ' The whole file was re-sent for a tiny edit.'}
          {chunked && last.mb > 0 && ' Only changed blocks were sent; the server rebuilds the file from its block list.'}
        </div>
      )}
      <div className="small muted" style={{ marginTop: 6 }}>
        Bonus: if two users upload the same block (same hash), the server stores it once (deduplication).
      </div>
    </Widget>
  );
}
