"""Draw the pixel shield app icon as PNGs (no dependencies). Run: python3 scripts/make-icons.py"""
import struct, zlib, sys, os

SHIELD = [
    "kkkkkkkkk",
    "kgggkyyyk",
    "kgggkyyyk",
    "kgggkyyyk",
    "kkkkkkkkk",
    "kyyykgggk",
    ".kyykggk.",
    "..kykgk..",
    "...kkk...",
]
COLORS = {"k": (43, 33, 24), "g": (61, 107, 69), "y": (216, 160, 48)}
BG = (232, 220, 188)


def png(size, path, pad_ratio=0.2):
    grid = 9
    px = int(size * (1 - 2 * pad_ratio)) // grid
    off_x = (size - px * grid) // 2
    off_y = (size - px * grid) // 2
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            gx, gy = (x - off_x) // px, (y - off_y) // px
            c = BG
            if 0 <= gx < grid and 0 <= gy < grid and x >= off_x and y >= off_y:
                ch = SHIELD[gy][gx] if gx < len(SHIELD[gy]) else "."
                c = COLORS.get(ch, BG)
            row += bytes(c)
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(data)


out = os.path.join(os.path.dirname(__file__), "..", "public")
png(192, os.path.join(out, "icon-192.png"))
png(512, os.path.join(out, "icon-512.png"))
png(180, os.path.join(out, "apple-touch-icon.png"))
png(64, os.path.join(out, "favicon.png"), pad_ratio=0.05)
print("icons written")
