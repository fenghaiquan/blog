#!/usr/bin/env node
/**
 * build-cheatsheet.js — 从 agentic-patterns 知识库提取模式速查表
 *
 * 读取 13 个主题 _index.md 的模式速查表 + 各模式 frontmatter 的 status，
 * 生成《AI Agent 工程模式速查手册》手稿（markdown + stats）到 vault 产品目录。
 *
 * 用法：node scripts/build-cheatsheet.js [--src=/path/to/agentic-patterns] [--out=/path/to/manuscript]
 */

const fs = require('fs');
const path = require('path');

// ---------- 配置 ----------
const DEFAULT_SRC = '/mnt/d/Documents/Obsidian/LLMBrain/2_Raw/External/agentic-patterns';
const DEFAULT_OUT = '/mnt/d/Documents/Obsidian/LLMBrain/5_Output/Product/product-cheatsheet/manuscript';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  })
);
const SRC = path.resolve(args.src || DEFAULT_SRC);
const OUT = path.resolve(args.out || DEFAULT_OUT);

// 主题顺序与元数据（源自 _registry.md 十三主题导航表）
const THEMES = [
  { ch: 3, tcode: 'T1.1.1', dir: 'context', title: '上下文', q: '有限窗口内，什么信息何时以何形式存在？' },
  { ch: 4, tcode: 'T1.1.2', dir: 'reasoning', title: '推理', q: '多少算力换多少推理质量？' },
  { ch: 5, tcode: 'T1.2.1', dir: 'tools', title: '工具', q: '工具如何被发现、选择、安全执行、协同？' },
  { ch: 6, tcode: 'T1.3.1', dir: 'architecture', title: '架构', q: '控制流、并行度、自主性各放在谱系何处？' },
  { ch: 7, tcode: 'T1.3.2', dir: 'multi-agent', title: '多智能体', q: '何时拆分、拆成什么拓扑、如何防污染？' },
  { ch: 8, tcode: 'T2.1.1', dir: 'quality', title: '质量', q: '错误在哪一阶段被哪道防线拦截？' },
  { ch: 9, tcode: 'T2.1.2', dir: 'security', title: '安全', q: '信任边界画在哪里？三要素如何切断？' },
  { ch: 10, tcode: 'T3.1.1', dir: 'learning', title: '学习', q: '学习发生在哪一层位面？' },
  { ch: 11, tcode: 'T3.1.2', dir: 'observability', title: '可观测性', q: '非确定系统如何可见、可判定、可反馈、可固化？' },
  { ch: 12, tcode: 'T3.1.3', dir: 'code-review', title: '代码审查', q: '谁审查 AI 的代码？代码库如何为 AI 重构？' },
  { ch: 13, tcode: 'T4.1.1', dir: 'human-in-loop', title: '人机协作', q: '自主性给多少？如何无缝切换？' },
  { ch: 14, tcode: 'T4.1.2', dir: 'developer-experience', title: '开发者体验', q: '开发栈如何为两个用户重构？' },
  { ch: 15, tcode: 'T4.2.1', dir: 'cost-performance', title: '成本与性能', q: '钱在生命周期哪个阶段以什么策略花？' },
];
const dirToChapter = Object.fromEntries(THEMES.map((t) => [t.dir, t.ch]));

// status → 展示标记
const STATUS_MAP = {
  'validated-in-production': '● 生产验证',
  'best-practice': '★ 成熟',
  established: '★ 成熟',
  published: '★ 成熟',
  emerging: '◐ 新兴',
  'rapidly-improving': '◐ 新兴',
  proposed: '○ 提案',
  'experimental-but-awesome': '○ 实验',
};

// ---------- 工具函数 ----------
const read = (p) => fs.readFileSync(p, 'utf8');

/** 从模式文件的 frontmatter 提取 status（只读前 25 行，避免读大文件） */
function patternStatus(patternFile) {
  try {
    const head = read(patternFile).split('\n').slice(0, 25).join('\n');
    const m = head.match(/^\s*status:\s*"?([a-z-]+)"?/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const statusMark = (s) => (s && STATUS_MAP[s]) || '— 未标注';

/** 解析 _index.md 中的模式速查表与跨主题收录 */
function parseIndex(themeDir) {
  const text = read(path.join(SRC, themeDir, '_index.md'));
  const patterns = [];
  let inCrossSection = false;
  const cross = [];
  for (const line of text.split('\n')) {
    if (/^##\s/.test(line)) inCrossSection = /跨主题收录/.test(line);
    // 模式表行：| [[patterns/slug.md\|名称]] | 说明 |
    const m = line.match(
      /^\|\s*\[\[patterns\/([^|\]]+?)\.md\\?\|([^\]]+?)\]\]\s*\|\s*(.*?)\s*\|\s*$/
    );
    if (m) {
      const [, slug, name, desc] = m;
      if (!desc.trim()) continue; // 跳过无说明的噪声行（如误录的 .png）
      patterns.push({ slug: `${slug}.md`, name: name.trim(), desc: desc.trim() });
      continue;
    }
    if (inCrossSection) {
      // - [[../other-dir/patterns/slug.md\|名称]] → 主题名
      const c = line.match(
        /\[\[\.\.\/([^/]+)\/patterns\/([^|\]]+?)\.md\\?\|([^\]]+?)\]\]\s*(?:→|->)?\s*(.*)$/
      );
      if (c) cross.push({ dir: c[1], slug: `${c[2]}.md`, name: c[3].trim(), note: c[4].trim() });
    }
  }
  return { patterns, cross };
}

/** 解析 _registry.md 的常见问题速查表（只取该标题之后的表格行） */
function parseFaq() {
  const text = read(path.join(SRC, '_registry.md'));
  const rows = [];
  let inFaq = false;
  for (const line of text.split('\n')) {
    if (/^##\s/.test(line)) inFaq = /常见问题速查/.test(line);
    if (!inFaq) continue;
    if (line.startsWith('| 我遇到的问题') || line.startsWith('| ---')) continue;
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (m) rows.push({ problem: m[1], refs: m[2] });
  }
  return rows;
}

/** 从 wikilink 路径解析主题目录与显示名：[[context/patterns/x.md\|名]] 或 [[../context/patterns/x.md\|名]] */
function parseRef(ref) {
  const m = ref.match(/\[\[([^\]]+?)\.md\\?\|([^\]]+?)\]\]/);
  if (!m) return null;
  const seg = m[1].split('/'); // [..] context patterns slug | [context, patterns, slug]
  const dir = seg[0] === '..' ? seg[1] : seg[0];
  return { dir, name: m[2] };
}

// ---------- 主流程 ----------
function main() {
  fs.mkdirSync(path.join(OUT, 'chapters'), { recursive: true });

  const stats = { themes: [], statusCount: {}, total: 0, unlabeled: 0 };

  for (const theme of THEMES) {
    const { patterns, cross } = parseIndex(theme.dir);
    const withStatus = patterns.map((p) => ({
      ...p,
      status: patternStatus(path.join(SRC, theme.dir, 'patterns', p.slug)),
    }));

    const crossResolved = cross.map((c) => ({
      ...c,
      status: patternStatus(path.join(SRC, c.dir, 'patterns', c.slug)),
      ch: dirToChapter[c.dir],
    }));

    // 生成章节文件
    const lines = [
      `# ${theme.ch}. ${theme.title}（${theme.tcode}）`,
      '',
      `> **问题句**：${theme.q}`,
      `> **本主题模式数**：${withStatus.length}（另有跨主题收录 ${crossResolved.length} 个）`,
      '',
      `| 模式 | 一句话说明 | 证据等级 |`,
      `| --- | --- | --- |`,
      ...withStatus.map((p) => `| **${p.name}** | ${p.desc} | ${statusMark(p.status)} |`),
    ];

    if (crossResolved.length) {
      lines.push(
        '',
        `**跨主题收录**（收录于其他主题目录，与本主题强相关）：`,
        '',
        `| 模式 | 一句话说明 | 证据等级 |`,
        `| --- | --- | --- |`,
        ...crossResolved.map(
          (c) => `| **${c.name}**（第 ${c.ch} 章） | ${c.note || '—'} | ${statusMark(c.status)} |`
        )
      );
    }
    lines.push('');
    fs.writeFileSync(
      path.join(OUT, 'chapters', `${String(theme.ch).padStart(2, '0')}-${theme.dir}.md`),
      lines.join('\n')
    );

    // 汇总统计
    const sc = {};
    for (const p of withStatus) {
      stats.total++;
      if (!p.status) stats.unlabeled++;
      else sc[p.status] = (sc[p.status] || 0) + 1, (stats.statusCount[p.status] = (stats.statusCount[p.status] || 0) + 1);
    }
    stats.themes.push({
      ch: theme.ch,
      tcode: theme.tcode,
      dir: theme.dir,
      title: theme.title,
      q: theme.q,
      patterns: withStatus.length,
      cross: crossResolved.length,
      statusBreakdown: sc,
    });
  }

  // 生成 FAQ 章节
  const faq = parseFaq();
  const faqLines = [
    '# 2. 常见问题速查',
    '',
    '> 遇到问题时从这里入手：先按问题定位模式，再跳到对应章节查证据等级与说明。',
    '',
    `| 我遇到的问题 | 推荐先看 |`,
    `| --- | --- |`,
  ];
  for (const row of faq) {
    const refs = row.refs
      .split(/[、,，]/)
      .map((r) => {
        const ref = parseRef(r);
        return ref ? `**${ref.name}**（第 ${dirToChapter[ref.dir] || '?'} 章）` : r.trim();
      })
      .filter(Boolean)
      .join('、');
    faqLines.push(`| ${row.problem} | ${refs} |`);
  }
  faqLines.push('');
  fs.writeFileSync(path.join(OUT, '02-faq.md'), faqLines.join('\n'));

  fs.writeFileSync(path.join(OUT, 'stats.json'), JSON.stringify(stats, null, 2));

  // 汇总输出
  console.log(`✅ 提取完成 → ${OUT}`);
  console.log(`   模式总数：${stats.total}（未标注 status：${stats.unlabeled}）`);
  console.log('   证据等级分布：');
  for (const [s, n] of Object.entries(stats.statusCount).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${s.padEnd(26)} ${n}`);
  }
  console.log(`   FAQ 条目：${faq.length}`);
}

main();
