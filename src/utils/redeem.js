// 兑换码零存储生成/验证（ADR-007）
// 码 = Crockford base32(HMAC-SHA256(REDEEM_SECRET, "{batch}-{n}")) 前 REDEEM_CODE_LEN 位
// 验证端只需 REDEEM_SECRET 重算候选集比对，无需数据库/清单存储
import crypto from 'node:crypto';

export const REDEEM_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford：无 I/L/O/U 易混字符
export const REDEEM_CODE_LEN = 20;

export function rawCode(secret, batch, n) {
	const mac = crypto.createHmac('sha256', secret).update(`${batch}-${n}`).digest();
	let bits = 0;
	let value = 0;
	let out = '';
	for (const b of mac) {
		value = (value << 8) | b;
		bits += 8;
		while (bits >= 5 && out.length < REDEEM_CODE_LEN) {
			out += REDEEM_ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
		if (out.length >= REDEEM_CODE_LEN) break;
	}
	return out;
}

export function formatCode(raw) {
	return raw.replace(/(.{5})/g, '$1-').replace(/-$/, '');
}

// 输入容错：去分隔符、大写、按 Crockford 规则纠易混字符
export function normalizeCode(input) {
	return String(input || '')
		.toUpperCase()
		.replace(/[^0-9A-Z]/g, '')
		.replace(/O/g, '0')
		.replace(/[IL]/g, '1')
		.replace(/U/g, 'V');
}

export function verifyCode(secret, batch, count, input) {
	const norm = normalizeCode(input);
	if (!secret || norm.length !== REDEEM_CODE_LEN) return false;
	const target = Buffer.from(norm, 'utf8');
	for (let n = 1; n <= count; n++) {
		const cand = Buffer.from(rawCode(secret, batch, n), 'utf8');
		if (crypto.timingSafeEqual(cand, target)) return true;
	}
	return false;
}
