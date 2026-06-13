#!/usr/bin/env python3
"""鉄パイプ壁（4方向接続の16パターン）・床・階段タイルを生成する。

出力: public/assets/tilesets/steamworks.png（16×16 px のフレーム × 8列3行）
  フレーム 0-15: パイプ。接続ビットマスク N=1, E=2, S=4, W=8
  フレーム 16: 上り階段 / 17: 下り階段 / 18: 封鎖された階段（格子付き）
  フレーム 19-21: リベット鉄板の床（3 バリエーション）
  フレーム 22: エレベーター床

グレースケールで描き、ゲーム側の tint で各階の色（錆び・真鍮・シアン等）を付ける。
"""
import struct
import zlib

T = 16
COLS, ROWS = 8, 3
W, H = COLS * T, ROWS * T

OUT = (0x23, 0x23, 0x2A, 255)
DK = (0x4F, 0x4F, 0x58, 255)
MD = (0x8A, 0x8A, 0x94, 255)
LT = (0xC4, 0xC4, 0xCC, 255)
HI = (0xE2, 0xE2, 0xEA, 255)
PIT1 = (0x3A, 0x3A, 0x42, 255)
PIT2 = (0x1E, 0x1E, 0x24, 255)
PIT3 = (0x0A, 0x0A, 0x0E, 255)

BRIGHT = {OUT: 0, DK: 1, MD: 2, LT: 3, HI: 4}
SHADE = {4: OUT, 5: DK, 6: MD, 7: LT, 8: LT, 9: MD, 10: DK, 11: OUT}

img = [[(0, 0, 0, 0)] * W for _ in range(H)]


def put(fx, fy, x, y, c):
    if 0 <= x < T and 0 <= y < T:
        img[fy * T + y][fx * T + x] = c


def draw_pipe(frame, mask):
    fx, fy = frame % COLS, frame // COLS
    n, e, s, w = mask & 1, mask & 2, mask & 4, mask & 8

    def in_v(x, y):
        if not (4 <= x <= 11):
            return False
        return (n and y <= 8) or (s and y >= 8)

    def in_h(x, y):
        if not (4 <= y <= 11):
            return False
        return (w and x <= 8) or (e and x >= 8)

    for y in range(T):
        for x in range(T):
            v, hh = in_v(x, y), in_h(x, y)
            if mask == 0:
                if 4 <= x <= 11 and 4 <= y <= 11:
                    c = SHADE[x]
                    if y in (4, 11):
                        c = OUT
                    put(fx, fy, x, y, c)
                continue
            if v and hh:
                cv, ch = SHADE[x], SHADE[y]
                put(fx, fy, x, y, cv if BRIGHT[cv] >= BRIGHT[ch] else ch)
            elif v:
                put(fx, fy, x, y, SHADE[x])
            elif hh:
                put(fx, fy, x, y, SHADE[y])

    def ring_h(y0, y1):
        for x in range(3, 13):
            edge = x in (3, 12)
            put(fx, fy, x, y0, OUT if edge else DK)
            put(fx, fy, x, y1, OUT if edge else (HI if x in (7, 8) else MD))

    def ring_v(x0, x1):
        for y in range(3, 13):
            edge = y in (3, 12)
            put(fx, fy, x0, y, OUT if edge else DK)
            put(fx, fy, x1, y, OUT if edge else (HI if y in (7, 8) else MD))

    if n:
        ring_h(0, 1)
    if s:
        ring_h(15, 14)
    if w:
        ring_v(0, 1)
    if e:
        ring_v(15, 14)

    if mask == 1:
        ring_h(9, 8)
    elif mask == 4:
        ring_h(6, 7)
    elif mask == 2:
        ring_v(6, 7)
    elif mask == 8:
        ring_v(9, 8)


def draw_stairs_up(frame):
    fx, fy = frame % COLS, frame // COLS
    for y in range(T):
        for x in range(2, 14):
            if x in (2, 13):
                put(fx, fy, x, y, OUT)
                continue
            g = y % 4
            put(fx, fy, x, y, (HI, MD, DK, OUT)[g])


def draw_stairs_down(frame):
    fx, fy = frame % COLS, frame // COLS
    bands = [(0, OUT), (1, MD), (2, MD), (3, DK), (4, DK), (5, PIT1), (6, PIT1)]
    for y in range(T):
        for x in range(T):
            if x in (0, 15) or y in (0, 15):
                put(fx, fy, x, y, OUT)
                continue
            c = PIT3 if y >= 10 else PIT2 if y >= 7 else dict(bands).get(y, PIT2)
            put(fx, fy, x, y, c)


def draw_stairs_locked(frame):
    draw_stairs_up(frame)
    fx, fy = frame % COLS, frame // COLS
    for bx in (3, 7, 11):
        for y in range(T):
            put(fx, fy, bx, y, DK if y % 5 else OUT)
            put(fx, fy, bx + 1, y, OUT)
    for x in range(2, 14):
        put(fx, fy, x, 7, OUT)
        put(fx, fy, x, 8, DK)


FLOOR_BASE = (0x6E, 0x6E, 0x78, 255)
FLOOR_HI = (0x8C, 0x8C, 0x98, 255)
FLOOR_DK = (0x54, 0x54, 0x5E, 255)
FLOOR_LINE = (0x44, 0x44, 0x4D, 255)


def draw_bolt(fx, fy, cx, cy):
    put(fx, fy, cx, cy, FLOOR_DK)
    put(fx, fy, cx + 1, cy, FLOOR_DK)
    put(fx, fy, cx, cy + 1, FLOOR_DK)
    put(fx, fy, cx + 1, cy + 1, HI)


def draw_floor_plate(frame, variant):
    fx, fy = frame % COLS, frame // COLS
    for y in range(T):
        for x in range(T):
            c = FLOOR_BASE
            if y == 0 or x == 0:
                c = FLOOR_HI       # 上・左の縁が光る
            elif y == T - 1 or x == T - 1:
                c = FLOOR_DK       # 下・右の縁が陰る
            put(fx, fy, x, y, c)
    for (bx, by) in ((2, 2), (T - 4, 2), (2, T - 4), (T - 4, T - 4)):
        draw_bolt(fx, fy, bx, by)
    if variant == 1:
        for x in range(2, T - 2):   # 中央の継ぎ目
            put(fx, fy, x, 8, FLOOR_LINE)
    elif variant == 2:
        for (sx, sy) in ((6, 5), (7, 5), (8, 6), (9, 10), (10, 10), (5, 11)):
            put(fx, fy, sx, sy, FLOOR_LINE)  # 擦り傷


def draw_elevator(frame):
    fx, fy = frame % COLS, frame // COLS
    for y in range(T):
        for x in range(T):
            if x in (0, T - 1) or y in (0, T - 1):
                put(fx, fy, x, y, OUT)            # 外枠
            elif x in (1, T - 2) or y in (1, T - 2):
                put(fx, fy, x, y, LT)             # 内枠（レール）
            elif y % 3 == 0:
                put(fx, fy, x, y, DK)             # 床の格子
            else:
                put(fx, fy, x, y, MD)


for m in range(16):
    draw_pipe(m, m)
draw_stairs_up(16)
draw_stairs_down(17)
draw_stairs_locked(18)
draw_floor_plate(19, 0)
draw_floor_plate(20, 1)
draw_floor_plate(21, 2)
draw_elevator(22)


def write_png(path):
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xFFFFFFFF)

    raw = b''
    for y in range(H):
        raw += b'\x00' + b''.join(bytes(px) for px in img[y])
    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0))
    out += chunk(b'IDAT', zlib.compress(raw, 9))
    out += chunk(b'IEND', b'')
    open(path, 'wb').write(out)


if __name__ == '__main__':
    import os
    dest = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'tilesets', 'steamworks.png')
    write_png(os.path.abspath(dest))
    print(f'wrote {os.path.abspath(dest)} ({W}x{H})')
