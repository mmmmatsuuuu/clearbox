#!/usr/bin/env python3
"""スチームパンクのフィールドタイル（32×32 px）を生成する。

出力: public/assets/tilesets/steamworks.png（32×32 px のフレーム × 5列3行）
   0 レンガの床          1 リベットの床        2 レンガの壁（外壁）
   3 真鍮の壁（外壁）    4 パイプ壁A           5 パイプ壁B
   6 パイプ壁C           7 ランプの壁          8 モニターの壁
   9 上り階段           10 下り階段           11 封鎖階段
  12 機械仕掛けの像     13 水晶の祭壇

床・壁は不透明、像と祭壇は背景透過（床の上に重ねる）。色は焼き込み済み。
"""
import struct
import zlib

T = 32
COLS, ROWS = 5, 3
W, H = COLS * T, ROWS * T

CL = lambda r, g, b, a=255: (r, g, b, a)
NONE = (0, 0, 0, 0)
OUT = CL(0x16, 0x12, 0x18)

MORTAR = CL(0x2a, 0x20, 0x1e)
BRICK_D = CL(0x5a, 0x2e, 0x22)
BRICK_M = CL(0x7c, 0x40, 0x2e)
BRICK_L = CL(0x96, 0x52, 0x3c)
WMORTAR = CL(0x24, 0x1c, 0x1a)
WBRICK_D = CL(0x46, 0x32, 0x2e)
WBRICK_M = CL(0x60, 0x46, 0x3e)
WBRICK_L = CL(0x7a, 0x5c, 0x4e)

STONE_D = CL(0x40, 0x3c, 0x3a)
STONE_M = CL(0x60, 0x5b, 0x57)
STONE_L = CL(0x82, 0x7c, 0x76)
STONE_H = CL(0xa4, 0x9e, 0x96)

IRON_D = CL(0x34, 0x37, 0x40)
IRON_M = CL(0x54, 0x58, 0x62)
IRON_L = CL(0x76, 0x7c, 0x88)
IRON_H = CL(0x9c, 0xa2, 0xae)

COP_D = CL(0x6c, 0x39, 0x18)
COP_M = CL(0xa6, 0x5d, 0x26)
COP_L = CL(0xcb, 0x82, 0x3e)
COP_H = CL(0xe8, 0xb4, 0x6c)

BR_D = CL(0x70, 0x52, 0x16)
BR_M = CL(0xa8, 0x80, 0x28)
BR_L = CL(0xcc, 0xa4, 0x40)
BR_H = CL(0xec, 0xcc, 0x74)

GLOW_C = CL(0xff, 0xe6, 0x9a)
GLOW_M = CL(0xff, 0xc0, 0x5a)
GLOW_O = CL(0xff, 0x96, 0x36)

SCR_D = CL(0x0c, 0x26, 0x16)
SCR_M = CL(0x22, 0x74, 0x38)
SCR_L = CL(0x52, 0xd8, 0x64)

CRY_D = CL(0x18, 0x6e, 0x88)
CRY_M = CL(0x3e, 0xc4, 0xe2)
CRY_L = CL(0xa2, 0xf2, 0xff)

SHAFT1 = CL(0x26, 0x28, 0x30)
SHAFT2 = CL(0x14, 0x15, 0x1b)
SHAFT3 = CL(0x07, 0x07, 0x0b)
RED = CL(0xc8, 0x34, 0x34)

img = [[NONE] * W for _ in range(H)]


def put(fr, x, y, c):
    if 0 <= x < T and 0 <= y < T and c is not None:
        fx, fy = (fr % COLS) * T, (fr // COLS) * T
        img[fy + y][fx + x] = c


def rect(fr, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(fr, x, y, c)


def brick_bg(fr, d, m, l, mortar):
    rect(fr, 0, 0, T - 1, T - 1, mortar)
    for ci in range(4):
        cy = ci * 8
        offset = 0 if ci % 2 == 0 else 8
        bx = -offset
        while bx < T:
            x0, x1 = bx + 1, bx + 15
            for y in range(cy + 1, cy + 8):
                for x in range(max(0, x0), min(T, x1)):
                    c = m
                    if y == cy + 1:
                        c = l
                    elif y == cy + 7:
                        c = d
                    put(fr, x, y, c)
            put(fr, max(0, x0), cy + 7, mortar)
            bx += 16


def panel(fr, d, m, l, h):
    for y in range(T):
        for x in range(T):
            c = m
            if x == 0 or y == 0:
                c = l
            elif x == T - 1 or y == T - 1:
                c = d
            put(fr, x, y, c)
    for y in range(3, T - 2, 4):
        for x in range(2, T - 2, 2):
            put(fr, x, y, l if (x + y) % 4 else d)
    _ = h


def bolt(fr, cx, cy, ring=IRON_D, hi=IRON_H):
    put(fr, cx, cy, hi)
    put(fr, cx - 1, cy, ring)
    put(fr, cx + 1, cy, ring)
    put(fr, cx, cy - 1, ring)
    put(fr, cx, cy + 1, ring)


COP_ACROSS = [OUT, COP_D, COP_M, COP_H, COP_L, COP_M, COP_D, OUT]


def pipe_v(fr, cx, y0, y1):
    for y in range(y0, y1 + 1):
        for i, c in enumerate(COP_ACROSS):
            put(fr, cx - 4 + i, y, c)


def pipe_h(fr, cy, x0, x1):
    for x in range(x0, x1 + 1):
        for i, c in enumerate(COP_ACROSS):
            put(fr, x, cy - 4 + i, c)


def flange_h(fr, cy, cx):
    rect(fr, cx - 6, cy - 1, cx + 5, cy, BR_M)
    rect(fr, cx - 6, cy, cx + 5, cy, BR_D)
    for x in (cx - 5, cx + 4):
        put(fr, x, cy - 1, BR_H)


def flange_v(fr, cx, cy):
    rect(fr, cx - 1, cy - 6, cx, cy + 5, BR_M)
    rect(fr, cx, cy - 6, cx, cy + 5, BR_D)
    for y in (cy - 5, cy + 4):
        put(fr, cx - 1, y, BR_H)


def valve(fr, cx, cy):
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            if abs(dx) + abs(dy) <= 3:
                put(fr, cx + dx, cy + dy, BR_M)
    put(fr, cx, cy, BR_H)
    for (dx, dy) in ((-4, 0), (4, 0), (0, -4), (0, 4)):
        put(fr, cx + dx, cy + dy, BR_L)


# ── 0,1: 床 ───────────────────────────────────────────
def t_floor_brick():
    brick_bg(0, BRICK_D, BRICK_M, BRICK_L, MORTAR)
    for (x, y) in ((5, 3), (20, 11), (11, 19), (26, 27), (14, 6)):
        put(0, x, y, BRICK_D)


def t_floor_rivet():
    panel(1, IRON_D, IRON_M, IRON_L, IRON_H)
    rect(1, 2, 15, T - 3, 16, IRON_D)
    rect(1, 2, 16, T - 3, 16, IRON_L)
    for (x, y) in ((4, 4), (T - 5, 4), (4, T - 5), (T - 5, T - 5), (15, 15)):
        bolt(1, x, y)


# ── 2,3: 外壁（レンガ・真鍮）───────────────────────────
def t_wall_brick():
    brick_bg(2, WBRICK_D, WBRICK_M, WBRICK_L, WMORTAR)
    # 立体的な壁ブロックに見せる縁取り（床との区別）
    rect(2, 0, 0, T - 1, 1, STONE_L)        # 上面の笠石
    rect(2, 0, 0, T - 1, 0, STONE_H)
    rect(2, 0, 0, 0, T - 1, WBRICK_L)       # 左の明
    rect(2, 0, T - 2, T - 1, T - 1, OUT)    # 下の影
    rect(2, T - 1, 0, T - 1, T - 1, WBRICK_D)
    for x in range(2, T - 2, 6):            # 上面笠石のリベット
        put(2, x, 0, BR_M)


def t_wall_brass():
    panel(3, BR_D, BR_M, BR_L, BR_H)
    # 上下の装飾帯
    rect(3, 1, 1, T - 2, 2, BR_H)
    rect(3, 1, T - 3, T - 2, T - 2, BR_D)
    for x in (4, 11, 20, 27):
        bolt(3, x, 5, BR_D, BR_H)
        bolt(3, x, T - 5, BR_D, BR_H)


# ── 4,5,6: パイプ壁（3パターン）───────────────────────
def t_wall_pipe_a():
    # 縦パイプ＋右分岐
    brick_bg(4, WBRICK_D, WBRICK_M, WBRICK_L, WMORTAR)
    pipe_v(4, 9, 0, T - 1)
    flange_h(4, 6, 9)
    flange_h(4, 24, 9)
    pipe_h(4, 16, 9, T - 1)
    put(4, 11, 13, COP_H); put(4, 12, 14, COP_H)


def t_wall_pipe_b():
    # 横パイプ＋バルブ
    brick_bg(5, WBRICK_D, WBRICK_M, WBRICK_L, WMORTAR)
    pipe_h(5, 11, 0, T - 1)
    flange_v(5, 8, 11)
    flange_v(5, 24, 11)
    valve(5, 16, 22)
    pipe_v(5, 16, 14, 19)


def t_wall_pipe_c():
    # 二本の縦パイプ
    brick_bg(6, WBRICK_D, WBRICK_M, WBRICK_L, WMORTAR)
    pipe_v(6, 8, 0, T - 1)
    pipe_v(6, 23, 0, T - 1)
    for cx in (8, 23):
        flange_h(6, 9, cx)
        flange_h(6, 22, cx)


# ── 7: ランプの壁 ─────────────────────────────────────
def t_wall_lamp():
    brick_bg(7, WBRICK_D, WBRICK_M, WBRICK_L, WMORTAR)
    rect(7, 15, 2, 16, 8, IRON_D)
    rect(7, 16, 5, 21, 6, IRON_M)
    rect(7, 12, 8, 19, 9, BR_M)
    rect(7, 12, 22, 19, 23, BR_M)
    put(7, 11, 8, BR_D); put(7, 20, 8, BR_D)
    rect(7, 11, 9, 11, 22, BR_D)
    rect(7, 20, 9, 20, 22, BR_D)
    for y in range(10, 22):
        for x in range(12, 20):
            d = abs(x - 15) + abs(y - 16)
            c = GLOW_C if d <= 2 else GLOW_M if d <= 4 else GLOW_O
            put(7, x, y, c)
    for (x, y) in ((10, 16), (21, 16), (15, 25), (15, 7), (9, 14), (22, 18)):
        put(7, x, y, GLOW_O)


# ── 8: モニターの壁 ───────────────────────────────────
def t_wall_monitor():
    brick_bg(8, WBRICK_D, WBRICK_M, WBRICK_L, WMORTAR)
    rect(8, 5, 6, 26, 25, IRON_D)
    rect(8, 6, 7, 25, 24, IRON_M)
    rect(8, 6, 7, 25, 8, IRON_L)
    rect(8, 9, 10, 22, 21, SCR_D)
    for y in range(10, 22):
        for x in range(9, 23):
            if (y % 2) == 0:
                put(8, x, y, SCR_M if (x + y) % 3 else SCR_D)
    for x in range(10, 22):
        yy = 16 + (2 if x % 4 == 0 else -1 if x % 4 == 2 else 0)
        put(8, x, yy, SCR_L)
    put(8, 9, 23, SCR_L); put(8, 12, 23, RED); put(8, 22, 23, BR_L)
    for (x, y) in ((5, 6), (26, 6), (5, 25), (26, 25)):
        bolt(8, x, y)


# ── 9,10,11: 階段 ─────────────────────────────────────
def stair_base(fr):
    rect(fr, 0, 0, T - 1, T - 1, STONE_M)
    rect(fr, 0, 0, 2, T - 1, STONE_D)       # 左の側壁
    rect(fr, T - 3, 0, T - 1, T - 1, STONE_D)
    rect(fr, 3, 0, 3, T - 1, STONE_H)       # 側壁のハイライト
    rect(fr, T - 4, 0, T - 4, T - 1, STONE_L)


def steps(fr, lit_top):
    # 横方向の段（6段）
    for s in range(6):
        y0 = 1 + s * 5
        rect(fr, 4, y0, T - 5, y0, STONE_H)     # 踏み面（明）
        rect(fr, 4, y0 + 1, T - 5, y0 + 3, STONE_M)
        rect(fr, 4, y0 + 4, T - 5, y0 + 4, STONE_D)  # 蹴上げの影
    _ = lit_top


def t_stair_up():
    stair_base(9)
    steps(9, True)
    rect(9, 4, 1, T - 5, 3, STONE_H)        # 上部は明るい踊り場（上り＝光へ）


def t_stair_down():
    stair_base(10)
    steps(10, False)
    rect(10, 4, 24, T - 5, T - 2, SHAFT2)   # 下部は暗い穴（下り＝闇へ）
    rect(10, 7, 27, T - 8, T - 2, SHAFT3)


def t_stair_locked():
    stair_base(11)
    steps(11, True)
    # かんぬき（横木）＋鎖
    rect(11, 2, 13, T - 3, 15, IRON_L)
    rect(11, 2, 16, T - 3, 16, IRON_D)
    for x in range(4, T - 4, 4):
        put(11, x, 14, IRON_D)
    for i in range(0, 28, 2):
        put(11, 3 + i, 13 + (i % 4 == 0), RED)


# ── 12: 機械仕掛けの像 ────────────────────────────────
def t_statue():
    rect(12, 7, 27, 24, 30, IRON_D)
    rect(12, 8, 26, 23, 27, IRON_M)
    rect(12, 10, 13, 21, 27, IRON_M)
    rect(12, 10, 13, 11, 27, IRON_L)
    rect(12, 20, 13, 21, 27, IRON_D)
    rect(12, 12, 6, 19, 13, IRON_L)
    rect(12, 13, 5, 18, 5, IRON_M)
    put(12, 14, 9, GLOW_C); put(12, 17, 9, GLOW_C)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            if abs(dx) + abs(dy) <= 2:
                put(12, 15 + dx, 19 + dy, BR_M)
    put(12, 15, 19, BR_H)
    for (dx, dy) in ((-3, 0), (3, 0), (0, -3), (0, 3)):
        put(12, 15 + dx, 19 + dy, BR_L)
    bolt(12, 11, 14, IRON_D, BR_H)
    bolt(12, 20, 14, IRON_D, BR_H)


# ── 13: 水晶の祭壇 ────────────────────────────────────
def t_altar():
    rect(13, 8, 24, 23, 30, IRON_D)
    rect(13, 9, 24, 22, 29, IRON_M)
    rect(13, 11, 20, 20, 24, IRON_M)
    rect(13, 11, 20, 20, 20, IRON_L)
    bolt(13, 11, 27, IRON_D, BR_H)
    bolt(13, 20, 27, IRON_D, BR_H)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            if abs(dx) + abs(dy) <= 2:
                put(13, 15 + dx, 26 + dy, BR_M)
    put(13, 15, 26, BR_H)
    for y in range(3, 20):
        half = (y - 3) if y <= 11 else (19 - y)
        half = max(0, half - 1)
        for x in range(15 - half, 17 + half):
            c = CRY_L if (x <= 15 and y <= 12) else (CRY_M if x <= 16 else CRY_D)
            put(13, x, y, c)
    put(13, 15, 8, CRY_L); put(13, 14, 10, CRY_L); put(13, 16, 13, CRY_L)
    rect(13, 14, 19, 17, 21, CRY_D)


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


t_floor_brick()
t_floor_rivet()
t_wall_brick()
t_wall_brass()
t_wall_pipe_a()
t_wall_pipe_b()
t_wall_pipe_c()
t_wall_lamp()
t_wall_monitor()
t_stair_up()
t_stair_down()
t_stair_locked()
t_statue()
t_altar()


if __name__ == '__main__':
    import os
    dest = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'tilesets', 'steamworks.png')
    write_png(os.path.abspath(dest))
    print(f'wrote {os.path.abspath(dest)} ({W}x{H})')
