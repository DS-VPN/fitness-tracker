// Shared image helpers used by both meal photos and progress photos.
//
// The client-declared MIME type is untrusted — another account could upload HTML labeled image/png,
// which must never end up served from our origin — so format is always determined from magic bytes,
// and metadata (EXIF/XMP/IPTC/comments, including phone GPS coordinates) is stripped before storage.

export type ImageExt = 'jpg' | 'png' | 'webp';

const MIME_BY_EXT: Record<ImageExt, string> = {
	jpg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp'
};

export function mimeForExt(ext: ImageExt): string {
	return MIME_BY_EXT[ext];
}

/** Identifies the image format from its magic bytes, or null if it isn't one of our accepted formats. */
export function sniffImageExt(buf: Buffer): ImageExt | null {
	if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
	if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
		return 'png';
	if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
		return 'webp';
	return null;
}

/** Removes metadata segments/chunks (EXIF GPS, XMP, IPTC, thumbnails, comments) while preserving the
 *  actual image data. Pure-JS, format-aware, no dependency. On anything unexpected it returns the input
 *  unchanged rather than risk corrupting the image — the magic-byte sniff already gates what gets here,
 *  and callers re-sniff the result. */
export function stripImageMetadata(buf: Buffer, ext: ImageExt): Buffer {
	try {
		if (ext === 'jpg') return stripJpeg(buf);
		if (ext === 'png') return stripPng(buf);
		if (ext === 'webp') return stripWebp(buf);
	} catch {
		// fall through — never throw from metadata stripping
	}
	return buf;
}

// --- JPEG -------------------------------------------------------------------
// Copy the SOI, then every marker segment except APP1..APP15 (EXIF/XMP/IPTC/Adobe) and COM (comments);
// APP0 (JFIF) is kept. At SOS the entropy-coded scan begins — copy the remainder verbatim.
function stripJpeg(buf: Buffer): Buffer {
	if (buf.length < 2 || buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
	const out: Buffer[] = [Buffer.from([0xff, 0xd8])];
	let i = 2;
	while (i + 1 < buf.length) {
		if (buf[i] !== 0xff) return buf; // malformed — bail, keep original
		const marker = buf[i + 1];
		if (marker === 0xd9) {
			out.push(buf.subarray(i)); // EOI + any trailer
			return Buffer.concat(out);
		}
		if (marker === 0xda) {
			out.push(buf.subarray(i)); // SOS onward is entropy data
			return Buffer.concat(out);
		}
		// RSTn / TEM / padding: standalone markers with no length field
		if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
			out.push(buf.subarray(i, i + 2));
			i += 2;
			continue;
		}
		if (i + 3 >= buf.length) return buf; // truncated length — bail
		const len = buf.readUInt16BE(i + 2);
		const segEnd = i + 2 + len;
		if (len < 2 || segEnd > buf.length) return buf; // corrupt — bail
		const isApp1Plus = marker >= 0xe1 && marker <= 0xef;
		const isComment = marker === 0xfe;
		if (!isApp1Plus && !isComment) out.push(buf.subarray(i, segEnd));
		i = segEnd;
	}
	return Buffer.concat(out);
}

// --- PNG --------------------------------------------------------------------
// Copy the signature then every chunk except the ancillary metadata ones (text, EXIF, timestamp).
function stripPng(buf: Buffer): Buffer {
	const DROP = new Set(['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']);
	const out: Buffer[] = [buf.subarray(0, 8)];
	let i = 8;
	while (i + 8 <= buf.length) {
		const len = buf.readUInt32BE(i);
		const type = buf.subarray(i + 4, i + 8).toString('latin1');
		const chunkEnd = i + 12 + len; // length(4) + type(4) + data(len) + crc(4)
		if (chunkEnd > buf.length) return buf; // corrupt — bail
		if (!DROP.has(type)) out.push(buf.subarray(i, chunkEnd));
		if (type === 'IEND') break;
		i = chunkEnd;
	}
	return Buffer.concat(out);
}

// --- WebP -------------------------------------------------------------------
// Drop EXIF/XMP chunks, clear the corresponding VP8X flag bits, and rewrite the RIFF size.
function stripWebp(buf: Buffer): Buffer {
	if (buf.length < 12) return buf;
	type Chunk = { fourcc: string; body: Buffer };
	const chunks: Chunk[] = [];
	let i = 12;
	while (i + 8 <= buf.length) {
		const fourcc = buf.subarray(i, i + 4).toString('latin1');
		const size = buf.readUInt32LE(i + 4);
		const dataStart = i + 8;
		const dataEnd = dataStart + size;
		if (dataEnd > buf.length) return buf; // corrupt — bail
		chunks.push({ fourcc, body: buf.subarray(dataStart, dataEnd) });
		i = dataEnd + (size % 2); // chunks are padded to an even length
	}
	const kept = chunks.filter((c) => c.fourcc !== 'EXIF' && c.fourcc !== 'XMP ');
	if (kept.length === chunks.length) return buf; // nothing to strip
	const vp8x = kept.find((c) => c.fourcc === 'VP8X');
	if (vp8x && vp8x.body.length >= 1) {
		// VP8X flags byte: bit 3 = EXIF, bit 2 = XMP. Clear both now that those chunks are gone.
		vp8x.body = Buffer.from(vp8x.body);
		vp8x.body[0] &= ~0b00001100;
	}
	const parts: Buffer[] = [];
	for (const c of kept) {
		const header = Buffer.alloc(8);
		header.write(c.fourcc, 0, 'latin1');
		header.writeUInt32LE(c.body.length, 4);
		parts.push(header, c.body);
		if (c.body.length % 2 === 1) parts.push(Buffer.from([0])); // re-pad
	}
	const payload = Buffer.concat(parts);
	const riff = Buffer.alloc(12);
	riff.write('RIFF', 0, 'latin1');
	riff.writeUInt32LE(payload.length + 4, 4); // size covers 'WEBP' + chunks
	riff.write('WEBP', 8, 'latin1');
	return Buffer.concat([riff, payload]);
}
