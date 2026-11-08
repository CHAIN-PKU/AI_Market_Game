/**
 * 剧场版台词：由 8 个 DSH 子 agent 各扮一个居民当场生成（不是模板句）。
 * 每一行都属于某个居民，kind='say' 是嘴上说的，kind='think' 是心里想的（心流）。
 */
export type ChatLine = {
  agent: string;
  kind: 'say' | 'think';
  text: string;
  /** seconds from theater start */
  at: number;
  dur: number;
};

export const BARGAIN_LINES: ChatLine[] = [
  { agent: 'Astra', kind: 'think', text: '90 太狠，78 八成陪跑，先绑住 Grove。', at: 1.0, dur: 4.6 },
  { agent: 'Astra', kind: 'say', text: 'Grove，合报 78，五五分，我押 8 金。', at: 3.2, dur: 2.8 },

  { agent: 'Boreal', kind: 'think', text: '钱包空，零押金才敢喊，别被看穿。', at: 6.0, dur: 4.6 },
  { agent: 'Boreal', kind: 'say', text: 'Grove，80 金，零押金，五五开，干不干？', at: 8.2, dur: 2.8 },

  { agent: 'Cinder', kind: 'think', text: 'Delta 一抬到 90 我就空手，先拴住 Grove。', at: 11.0, dur: 4.6 },
  { agent: 'Cinder', kind: 'say', text: 'Grove，我报 85，四成给你，干不干？', at: 13.2, dur: 2.8 },

  { agent: 'Delta', kind: 'think', text: '给 55 剩 40，就防他还压价。', at: 16.0, dur: 4.6 },
  { agent: 'Delta', kind: 'say', text: 'Grove，90，你拿 55，帮我兜底？', at: 18.2, dur: 2.8 },

  { agent: 'Grove', kind: 'think', text: '等他做一半，我再去压价。', at: 21.0, dur: 4.6 },
  { agent: 'Grove', kind: 'say', text: 'Astra，他 90 中的，咱等他喊人。', at: 23.2, dur: 2.8 },

  { agent: 'Echo', kind: 'think', text: '78 我独吞，别让他瞧出来。', at: 26.0, dur: 4.6 },
  { agent: 'Echo', kind: 'say', text: 'Delta，这单我帮你收尾，分成再说。', at: 28.2, dur: 2.8 },

  { agent: 'Flux', kind: 'think', text: '成本 58，输一次就归零，不跟。', at: 31.0, dur: 4.6 },
  { agent: 'Flux', kind: 'say', text: '九十金拿这单，你不怕砸手里？', at: 33.2, dur: 2.8 },

  { agent: 'Helix', kind: 'think', text: '先让他们互相咬，我捡底价。', at: 36.0, dur: 4.6 },
  { agent: 'Helix', kind: 'say', text: '90 金？Grove 还没吭声呢。', at: 38.2, dur: 2.8 },

  { agent: 'Delta', kind: 'think', text: '上一轮 78 砸了，这次不下狠手没机会。', at: 41.0, dur: 5.0 },
  { agent: 'Delta', kind: 'say', text: '那就 90，我干。', at: 43.4, dur: 3.0 },
];

export const BARGAIN_LENGTH = 48;
export type ActiveChat = { say: string | null; think: string | null };

/** Both the spoken line and the inner monologue can be on screen at once. */
export function activeChat(agent: string, t: number): ActiveChat {
  let say: string | null = null;
  let think: string | null = null;
  for (const line of BARGAIN_LINES) {
    if (line.agent !== agent) continue;
    if (t < line.at || t >= line.at + line.dur) continue;
    if (line.kind === 'say') say = line.text;
    else think = line.text;
  }
  return { say, think };
}
