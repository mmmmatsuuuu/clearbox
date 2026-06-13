#!/usr/bin/env python3
"""スチームパンクのフィールドタイル（32×32 px）を生成する。

出力: public/assets/tilesets/steamworks.png（32×32 px のフレーム × 5列2行）
  0 レンガの床        1 リベットの床      2 パイプの這うレンガ壁
  3 ランプの壁        4 モニターの壁      5 上りエレベーター
  6 下りエレベーター  7 封鎖エレベーター  8 機械仕掛けの像
  9 水晶の祭壇

床・壁は不透明、像と祭壇は背景透過（床の上に重ねる）。色は焼き込み済み。
"""
import struct
import zlib

T = 32
COLS, ROWS = 5, 2
W, H = COLS * T, ROWS * T

# ── パレット ───────────────────────────────────────────
CL = lambda r, g, b, a=255: (r, g, b, a)
NONE = (0, 0, 0, 0)
OUT = CL(0x16, 0x12, 0x18)

MORTAR = CL(0x2a, 0x20, 0x1e)
BRICK_D = CL(0x5a, 0x2e, 0x22)
BRICK_M = CL(0x7c, 0x40, 0x2e)
BRICK_L = CL(0x96, 0x52, 0x3c)
WBRICK_D = CL(0x44, 0x30, 0x2c)
WBRICK_M = CL(0x5e, 0x44, 0x3c)
WBRICK_L = CL(0x76, 0x58, 0x4c)

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


# ── 共通: レンガ背景 ───────────────────────────────────
def brick_bg(fr, d, m, l):
    rect(fr, 0, 0, T - 1, T - 1, MORTAR)
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
            # 角の欠け風の陰
            put(fr, max(0, x0), cy + 7, MORTAR)
            bx += 16


def iron_panel(fr):
    for y in range(T):
        for x in range(T):
            c = IRON_M
            if x == 0 or y == 0:
                c = IRON_L
            elif x == T - 1 or y == T - 1:
                c = IRON_D
            put(fr, x, y, c)
    # ブラッシュ目（横方向の微細なライン）
    for y in range(3, T - 2, 4):
        for x in range(2, T - 2, 2):
            put(fr, x, y, IRON_L if (x + y) % 4 else IRON_D)


def bolt(fr, cx, cy, ring=IRON_D, hi=IRON_H):
    put(fr, cx, cy, hi)
    put(fr, cx - 1, cy, ring)
    put(fr, cx + 1, cy, ring)
    put(fr, cx, cy - 1, ring)
    put(fr, cx, cy + 1, ring)


# 銅パイプ断面（8px 幅）の色
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


# ── 0: レンガの床 ─────────────────────────────────────
def t_floor_brick():
    brick_bg(0, BRICK_D, BRICK_M, BRICK_L)
    for (x, y) in ((5, 3), (20, 11), (11, 19), (26, 27), (14, 6)):
        put(0, x, y, BRICK_D)


# ── 1: リベットの床 ───────────────────────────────────
def t_floor_rivet():
    iron_panel(1)
    rect(1, 2, 15, T - 3, 16, IRON_D)
    rect(1, 2, 16, T - 3, 16, IRON_L)
    for (x, y) in ((4, 4), (T - 5, 4), (4, T - 5), (T - 5, T - 5), (15, 15)):
        bolt(1, x, y)


# ── 2: パイプの這うレンガ壁 ───────────────────────────
def t_wall_pipe():
    brick_bg(2, WBRICK_D, WBRICK_M, WBRICK_L)
    pipe_v(2, 9, 0, T - 1)
    flange_h(2, 6, 9)
    flange_h(2, 24, 9)
    bolt(2, 9, 6, BR_D, BR_H)
    bolt(2, 9, 24, BR_D, BR_H)
    pipe_h(2, 16, 9, T - 1)         # 右への分岐
    # エルボの内側ハイライト
    put(2, 11, 13, COP_H)
    put(2, 12, 14, COP_H)


# ── 3: ランプの壁 ─────────────────────────────────────
def t_wall_lamp():
    brick_bg(3, WBRICK_D, WBRICK_M, WBRICK_L)
    # ブラケット
    rect(3, 15, 2, 16, 8, IRON_D)
    rect(3, 16, 5, 21, 6, IRON_M)
    # ランプ枠
    rect(3, 12, 8, 19, 9, BR_M)
    rect(3, 12, 22, 19, 23, BR_M)
    put(3, 11, 8, BR_D); put(3, 20, 8, BR_D)
    rect(3, 11, 9, 11, 22, BR_D)
    rect(3, 20, 9, 20, 22, BR_D)
    # ガラス＋光
    for y in range(10, 22):
        for x in range(12, 20):
            d = abs(x - 15) + abs(y - 16)
            c = GLOW_C if d <= 2 else GLOW_M if d <= 4 else GLOW_O
            put(3, x, y, c)
    # 周囲のにじむ光
    for (x, y) in ((10, 16), (21, 16), (15, 25), (15, 7), (9, 14), (22, 18)):
        put(3, x, y, GLOW_O)


# ── 4: レトロモニターの壁 ─────────────────────────────
def t_wall_monitor():
    brick_bg(4, WBRICK_D, WBRICK_M, WBRICK_L)
    rect(4, 5, 6, 26, 25, IRON_D)
    rect(4, 6, 7, 25, 24, IRON_M)
    rect(4, 6, 7, 25, 8, IRON_L)
    # 画面
    rect(4, 9, 10, 22, 21, SCR_D)
    for y in range(10, 22):
        for x in range(9, 23):
            if (y % 2) == 0:
                put(4, x, y, SCR_M if (x + y) % 3 else SCR_D)
    # 緑のグリフ（波形）
    for x in range(10, 22):
        yy = 16 + (2 if x % 4 == 0 else -1 if x % 4 == 2 else 0)
        put(4, x, yy, SCR_L)
    # ボタン/LED
    put(4, 9, 23, SCR_L); put(4, 12, 23, RED); put(4, 22, 23, BR_L)
    for (x, y) in ((5, 6), (26, 6), (5, 25), (26, 25)):
        bolt(4, x, y)


# ── エレベーター共通枠 ────────────────────────────────
def elevator_frame(fr):
    rect(fr, 1, 1, T - 2, T - 2, IRON_D)
    rect(fr, 3, 3, T - 4, T - 4, IRON_M)
    rect(fr, 3, 3, T - 4, 4, IRON_L)
    for x in (2, T - 3):
        rect(fr, x, 1, x, T - 2, IRON_L)
    for (x, y) in ((4, 4), (T - 5, 4), (4, T - 5), (T - 5, T - 5)):
        bolt(fr, x, y)


def arrow(fr, top_y, up, c, edge=None):
    # up=True で上向き△、False で下向き▽（高さ5px）
    for r in range(5):
        half = r if up else (4 - r)
        y = top_y + r
        rect(fr, 16 - half, y, 16 + half, y, c)
        if edge is not None and half > 0:
            put(fr, 16 - half, y, edge)
            put(fr, 16 + half, y, edge)


# ── 5: 上りエレベーター ───────────────────────────────
def t_elev_up():
    elevator_frame(5)
    for y in range(9, 25, 3):
        rect(5, 6, y, T - 7, y, IRON_D)
    arrow(5, 11, True, BR_H, BR_D)
    # ケーブル
    rect(5, 16, 1, 16, 8, IRON_L)


# ── 6: 下りエレベーター ───────────────────────────────
def t_elev_down():
    elevator_frame(6)
    # 中央に降下シャフト
    rect(6, 7, 7, T - 8, T - 8, SHAFT1)
    rect(6, 9, 12, T - 10, T - 8, SHAFT2)
    rect(6, 11, 18, T - 12, T - 8, SHAFT3)
    arrow(6, 11, False, BR_H, BR_D)


# ── 7: 封鎖エレベーター ───────────────────────────────
def t_elev_locked():
    elevator_frame(7)
    for y in range(7, 25, 3):       # シャッター
        rect(7, 6, y, T - 7, y + 1, IRON_L)
        rect(7, 6, y + 2, T - 7, y + 2, IRON_D)
    # ×字のチェーン/かんぬき
    for i in range(20):
        put(7, 6 + i, 6 + i, RED)
        put(7, 25 - i, 6 + i, RED)


# ── 8: 機械仕掛けの像 ─────────────────────────────────
def t_statue():
    # 台座
    rect(8, 7, 27, 24, 30, IRON_D)
    rect(8, 8, 26, 23, 27, IRON_M)
    # 胴体
    rect(8, 10, 13, 21, 27, IRON_M)
    rect(8, 10, 13, 11, 27, IRON_L)
    rect(8, 20, 13, 21, 27, IRON_D)
    # 頭
    rect(8, 12, 6, 19, 13, IRON_L)
    rect(8, 13, 5, 18, 5, IRON_M)
    # 目（発光）
    put(8, 14, 9, GLOW_C); put(8, 17, 9, GLOW_C)
    # 胸の歯車
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            if abs(dx) + abs(dy) <= 2:
                put(8, 15 + dx, 19 + dy, BR_M)
    put(8, 15, 19, BR_H)
    for (dx, dy) in ((-3, 0), (3, 0), (0, -3), (0, 3)):
        put(8, 15 + dx, 19 + dy, BR_L)
    # 肩のボルト
    bolt(8, 11, 14, IRON_D, BR_H)
    bolt(8, 20, 14, IRON_D, BR_H)


# ── 9: 水晶の祭壇 ─────────────────────────────────────
def t_altar():
    # 台座（末広がり）
    rect(9, 8, 24, 23, 30, IRON_D)
    rect(9, 9, 24, 22, 29, IRON_M)
    rect(9, 11, 20, 20, 24, IRON_M)
    rect(9, 11, 20, 20, 20, IRON_L)
    # 側面の歯車/ボルト
    bolt(9, 11, 27, IRON_D, BR_H)
    bolt(9, 20, 27, IRON_D, BR_H)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            if abs(dx) + abs(dy) <= 2:
                put(9, 15 + dx, 26 + dy, BR_M)
    put(9, 15, 26, BR_H)
    # 水晶（菱形）
    for y in range(3, 20):
        half = (y - 3) if y <= 11 else (19 - y)
        half = max(0, half - 1)
        for x in range(15 - half, 17 + half):
            d = x - (15 - half)
            w = (16 + half) - (15 - half)
            if d <= 1 or x <= 16:
                c = CRY_L if (x <= 15 and y <= 12) else CRY_M
            else:
                c = CRY_D
            put(9, x, y, c)
    # 内部のきらめき
    put(9, 15, 8, CRY_L); put(9, 14, 10, CRY_L); put(9, 16, 13, CRY_L)
    # 台座へ刺さる根本
    rect(9, 14, 19, 17, 21, CRY_D)


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
t_wall_pipe()
t_wall_lamp()
t_wall_monitor()
t_elev_up()
t_elev_down()
t_elev_locked()
t_statue()
t_altar()


if __name__ == '__main__':
    import os
    dest = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'tilesets', 'steamworks.png')
    write_png(os.path.abspath(dest))
    print(f'wrote {os.path.abspath(dest)} ({W}x{H})')
