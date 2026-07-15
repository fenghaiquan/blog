export function formatDate(date: Date, style: 'iso' | 'readable' = 'iso'): string {
	if (style === 'readable') {
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
	}
	return date.toISOString().split('T')[0];
}

export function getReadTime(content: string): number {
	const words = content.split(/\s+/).length;
	return Math.ceil(words / 200);
}
