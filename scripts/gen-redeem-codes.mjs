#!/usr/bin/env node
// 生成面包多「自动回复·递减消息」兑换码批（ADR-007）
// 用法：node scripts/gen-redeem-codes.mjs [batch=b1] [count=200]
// REDEEM_SECRET 从环境变量或 .env 读取；输出文件已被 .gitignore，勿入库
import fs from 'node:fs';
import { rawCode, formatCode } from '../src/utils/redeem.js';

function loadSecret() {
	if (process.env.REDEEM_SECRET) return process.env.REDEEM_SECRET;
	if (!fs.existsSync('.env')) return null;
	const m = fs.readFileSync('.env', 'utf8').match(/^REDEEM_SECRET=(.+)\s*$/m);
	return m ? m[1].trim() : null;
}

const batch = process.argv[2] || 'b1';
const count = parseInt(process.argv[3] || '200', 10);
const secret = loadSecret();
if (!secret) {
	console.error('未找到 REDEEM_SECRET（环境变量或 .env）');
	process.exit(1);
}

const codes = Array.from({ length: count }, (_, i) => formatCode(rawCode(secret, batch, i + 1)));
const codeFile = `redeem-codes-${batch}.txt`;
const msgFile = `redeem-messages-${batch}.txt`;
const msg = (code) =>
	`感谢购买《AI Agent 工程模式速查手册》！你的专属下载码：${code}。请打开 https://www.fenghaiquan-ai.com/redeem 输入下载码，获取完整版 PDF（31 页）。下载码是你的购买凭证，请勿分享。`;

fs.writeFileSync(codeFile, codes.join('\n') + '\n');
fs.writeFileSync(msgFile, codes.map(msg).join('\n') + '\n');
console.log(`已生成 ${count} 个兑换码 → ${codeFile}、${msgFile}`);
console.log('上传路径：面包多「我的-设置-自动回复」→ 触发「购买作品」→ 行为「递减信息」→ 逐条粘贴 redeem-messages 内容');
