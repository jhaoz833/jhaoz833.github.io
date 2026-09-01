# 生成音乐播放器占位曲：合成氛围乐 → mp3 + 同步歌词 .lrc + 封面 svg
# 纯本地生成，无网络依赖。用法：python scripts/make-demo-track.py
# 依赖：numpy、Pillow、imageio-ffmpeg
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

try:
    import imageio_ffmpeg
except ImportError:
    sys.exit("缺少 imageio-ffmpeg：pip install imageio-ffmpeg")

ROOT = Path(__file__).resolve().parent.parent
MUSIC_DIR = ROOT / "public" / "music"
COVER_DIR = ROOT / "public" / "images" / "music"
MUSIC_DIR.mkdir(parents=True, exist_ok=True)
COVER_DIR.mkdir(parents=True, exist_ok=True)

SR = 44100


def rand(i: int) -> float:
    x = math.sin(i * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def note_freq(midi: int) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def midi_to_name(m: int) -> str:
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    return f"{names[m % 12]}{m // 12 - 1}"


# ---------------------------------------------------------------- 音色
def pad_voice(freq, dur, gain, detune=(0.0, 0.0)):
    """慢起慢收的弦垫音：正弦 + 柔和的二次谐波，双 detune 合唱"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in detune:
        f = freq * 2 ** (d / 1200)
        ph = rand(int(f)) * math.tau
        out += np.sin(math.tau * f * t + ph) + 0.35 * np.sin(math.tau * 2 * f * t + ph * 1.7)
    env = np.ones(n)
    a = int(1.4 * SR)
    env[:a] = np.linspace(0, 1, a) ** 2
    r = min(n - a, int(2.4 * SR))
    env[-r:] *= np.linspace(1, 0, r) ** 2
    return (out * env * gain / max(1, len(detune))).astype(np.float32)


def pluck(freq, dur, gain, kind="arp"):
    """指数衰减的拨弦/钟声"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * 2 ** ((rand(int(freq * 100)) - 0.5) * 0.4 / 1200)
    ph = rand(int(freq * 97)) * math.tau
    if kind == "arp":
        wave = np.sin(math.tau * f * t + ph) + 0.25 * np.sin(math.tau * f * 2 * t + ph * 1.7)
    else:
        wave = np.sin(math.tau * f * t + ph) + 0.5 * np.sin(math.tau * f * 2.01 * t + ph * 1.7)
    decay = np.exp(-t * (1 / 1.15 if kind == "arp" else 1 / 1.0))
    a = int(0.02 * SR)
    env = np.ones(n)
    env[:a] = np.linspace(0, 1, a)
    return (wave * decay * env * gain).astype(np.float32)


def bass(freq, dur, gain):
    n = int(dur * SR)
    t = np.arange(n) / SR
    wave = np.sin(math.tau * freq * t) + 0.3 * np.sin(math.tau * 2 * freq * t + 1.1)
    env = np.ones(n)
    a = int(0.25 * SR)
    env[:a] = np.linspace(0, 1, a) ** 1.5
    r = int(1.6 * SR)
    n2 = max(0, n - r)
    env[n2:] *= np.linspace(1, 0, min(r, n))[: n - n2]
    return (wave * env * gain).astype(np.float32)


def sparkle(freq, dur, gain):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = rand(int(freq)) * math.tau
    wave = np.sin(math.tau * freq * t + ph) + 0.6 * np.sin(math.tau * freq * 2.003 * t + ph)
    decay = np.exp(-t * 1.4)
    return (wave * decay * gain).astype(np.float32)


# ---------------------------------------------------------------- 曲目
import zlib

# (id, 标题, 时长s, 和弦长s, 和弦表[(名字, midi音集, 根音)], 琶音音程模式)
CH_AM7 = "Am7", [57, 60, 64, 67, 71], 45
CH_FM7 = "Fmaj7", [53, 57, 60, 64, 69], 41
CH_CM7 = "Cmaj7", [48, 52, 55, 59, 64], 36
CH_G6 = "G6", [55, 59, 62, 64, 67], 43

TRACKS = [
    {
        "id": "starlight-lullaby",
        "title": "星海摇篮",
        "dur": 140.0,
        "chord_len": 8.0,
        "prog": [CH_AM7, CH_FM7, CH_CM7, CH_G6],
        "vel": 0.9,
        "lyrics": [
            "星光落进摇篮里，轻轻摇",
            "岛屿漂过银河的浅湾",
            "风向说了句晚安，水波微澜",
            "灯火在窗边，慢慢眨着眼",
            "梦像纸船，飘向深蓝",
            "听见星星在合唱，很轻很轻",
            "睡吧，岛上的灯火都睡了",
            "晚风推着窗，谁也不孤单",
            "星雨落进摇篮里，轻轻摇",
            "天亮以前，我们再做个梦吧",
        ],
    },
    {
        "id": "misty-isle-morning",
        "title": "雾岛晨光",
        "dur": 130.0,
        "chord_len": 7.5,
        "prog": [
            ("Dmaj9", [50, 54, 57, 61, 66], 50),
            ("Bm7", [47, 50, 54, 57, 61], 47),
            ("Gmaj9", [55, 59, 62, 66, 71], 43),
            ("A9", [45, 49, 52, 57, 61], 45),
        ],
        "vel": 1.0,
        "lyrics": [
            "雾散开一条小路，通往岛心",
            "晨光从海面爬起来，揉揉眼睛",
            "露珠挂在树梢，像没醒的星星",
            "给每一扇小窗，擦亮一束光",
            "潮水退去，留下贝壳做的音符",
            "海鸟衔着歌，绕岛飞了三圈",
            "把昨晚的梦，晾在阳台上",
            "风吹过草甸，带来青草味的早安",
            "岛屿醒来，伸了个懒腰",
            "把今天，做成一张漂亮的书签",
            "早安，浮岛",
        ],
    },
]

FADE_IN, FADE_OUT = 1.2, 2.2


def synth_track(spec):
    dur = spec["dur"]
    n = int(dur * SR)
    L = np.zeros(n, dtype=np.float32)
    R = np.zeros(n, dtype=np.float32)
    chord_len = spec["chord_len"]
    prog = spec["prog"]
    seed = zlib.crc32(spec["id"].encode()) & 0xFFFF

    def add(buf, start, ch=None):
        s = int(start * SR)
        if s >= n:
            return
        seg = buf[: n - s]
        if ch == "L":
            L[s: s + len(seg)] += seg
        elif ch == "R":
            R[s: s + len(seg)] += seg
        else:
            L[s: s + len(seg)] += seg
            R[s: s + len(seg)] += seg

    n_chords = int(dur / chord_len)
    for ci in range(n_chords):
        name, tones, root = prog[ci % len(prog)]
        t0 = ci * chord_len
        pad_dur = chord_len + 3.0
        base = tones  # 垫音在中央八度
        for k, m in enumerate(base):
            d1, d2 = (-7.5, 5.5) if k % 2 == 0 else (-5.0, 8.0)
            g = 0.052 / len(base)
            v = pad_voice(note_freq(m), pad_dur, g, detune=(d1, d2))
            add(v, t0, "L" if k % 2 == 0 else "R")
        # 低音
        add(bass(note_freq(root - 12), chord_len + 1.0, 0.085), t0)
        # 琶音：八分音符循环和弦音，最后两拍提到高八度
        tones1 = tones + [m + 12 for m in tones]
        step = chord_len / 16
        for s8 in range(16):
            m = tones1[(ci * 3 + s8) % len(tones1)]
            if s8 >= 12:
                m += 12
            g = 0.055 if s8 % 8 in (0, 4) else 0.038
            add(pluck(note_freq(m), 1.6, g * spec["vel"]), t0 + s8 * step,
                "L" if (s8 + ci) % 2 == 0 else "R")
    # 星光高音点缀
    pent = [69, 72, 76, 79, 81, 84]
    n_spark = int(dur / 11)
    for k in range(n_spark):
        t = 4 + rand(seed + k * 7) * (dur - 12)
        m = pent[int(rand(seed + k * 3) * len(pent))]
        add(sparkle(note_freq(m), 1.3, 0.045), t, "L" if rand(seed + k * 11) < 0.5 else "R")

    # 整体渐入渐出 + 软限幅 + 归一到 -6dBFS
    env = np.ones(n, dtype=np.float32)
    a = int(FADE_IN * SR)
    env[:a] = np.linspace(0, 1, a) ** 1.5
    r = int(FADE_OUT * SR)
    env[-r:] *= np.linspace(1, 0, r) ** 1.5
    L *= env
    R *= env
    peak = max(np.abs(L).max(), np.abs(R).max(), 1e-9)
    g = 0.5 / peak
    L = np.tanh(L * g * 1.4) / np.tanh(1.4) * 0.5
    R = np.tanh(R * g * 1.4) / np.tanh(1.4) * 0.5
    return L, R


def write_lrc(spec):
    """按和弦时间轴生成同步歌词"""
    lyrics = spec["lyrics"]
    lines = []
    t = 3.2
    idx = 0
    while t < spec["dur"] - 6 and idx < len(lyrics):
        lines.append((t, lyrics[idx]))
        idx += 1
        t += 12.0
    body = "\n".join(
        f"[{int(t)//60:02d}:{int(t)%60:02d}.{int((t%1)*100):02d}]{txt}"
        for t, txt in lines
    )
    return (
        f"[ti:{spec['title']}]\n"
        f"[ar:岛主 · 占位曲]\n"
        f"[al:浮岛]\n"
        f"[offset:0]\n\n"
        f"{body}\n"
    )


# ---------------------------------------------------------------- 封面
def cover_svg(spec, motif):
    W = 600
    HAM = W

    def sparkle(x, y, r, fill, op=1):
        return (
            f'<path d="M{x} {y-r} C {x+r*0.08} {y-r*0.25}, {x+r*0.25} {y-r*0.08}, {x+r} {y} '
            f'C {x+r*0.25} {y+r*0.08}, {x+r*0.08} {y+r*0.25}, {x} {y+r} '
            f'C {x-r*0.08} {y+r*0.25}, {x-r*0.25} {y+r*0.08}, {x-r} {y} '
            f'C {x-r*0.25} {y-r*0.08}, {x-r*0.08} {y-r*0.25}, {x} {y-r} Z" '
            f'fill="{fill}" fill-opacity="{op}"/>'
        )

    stars = ""
    for i in range(38):
        stars += (
            f'<circle cx="{int(rand(i*3+1)*W)}" cy="{int(rand(i*3+2)*HAM)}" '
            f'r="{0.6+rand(i*7)*1.5:.1f}" fill="#e9ecff" '
            f'fill-opacity="{0.2+rand(i*5)*0.5:.2f}"/>'
        )
    a, b, glow = motif
    extra = ""
    if a == "ring":
        for i, r in enumerate((150, 172, 196)):
            extra += (
                f'<circle cx="300" cy="300" r="{r}" fill="none" stroke="#8ea2ff" '
                f'stroke-opacity="{0.32-i*0.06:.2f}" stroke-width="1.4" '
                f'stroke-dasharray="3 {9+i*5}"/>'
            )
        extra += sparkle(300, 300, 42, "#f5d9a0", 0.95)
        extra += sparkle(430, 200, 13, "#e9ecff", 0.9)
        extra += sparkle(170, 400, 10, "#b39dff", 0.85)
    else:
        extra += f'<ellipse cx="300" cy="390" rx="150" ry="26" fill="#1c2250"/>'
        extra += f'<ellipse cx="300" cy="382" rx="96" ry="17" fill="#2a3568"/>'
        extra += sparkle(300, 330, 30, "#f5d9a0", 0.9)
        extra += sparkle(440, 170, 12, "#e9ecff", 0.9)
        extra += sparkle(160, 240, 9, "#8ea2ff", 0.85)
        extra += (
            f'<path d="M300 352 C 340 352, 360 330, 390 336" stroke="#8ea2ff" '
            f'stroke-opacity="0.5" fill="none" stroke-width="2"/>'
        )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" viewBox="0 0 {W} {W}">'
        f'<defs>'
        f'<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#04050d"/></linearGradient>'
        f'<radialGradient id="nb" cx="0.3" cy="0.25" r="0.9">'
        f'<stop offset="0" stop-color="{glow}" stop-opacity="0.3"/>'
        f'<stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient></defs>'
        f'<rect width="{W}" height="{W}" fill="url(#bg)"/>'
        f'<rect width="{W}" height="{W}" fill="url(#nb)"/>'
        f'{stars}{extra}</svg>'
    )


def encode_mp3(L, R, path):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    stereo = np.stack([L, R], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16).tobytes()
    cmd = [
        ffmpeg, "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
        "-c:a", "libmp3lame", "-b:a", "128k", str(path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    proc.stdin.write(pcm)
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        sys.exit(f"ffmpeg 编码失败：{proc.stderr.read().decode('utf-8', 'ignore')[-800:]}")


def main():
    for i, spec in enumerate(TRACKS):
        L, R = synth_track(spec)
        mp3 = MUSIC_DIR / f"{spec['id']}.mp3"
        encode_mp3(L, R, mp3)
        (MUSIC_DIR / f"{spec['id']}.lrc").write_text(write_lrc(spec), encoding="utf-8")
        motif = ("ring", "#8ea2ff", "#b39dff") if i == 0 else ("isle", "#8ea2ff", "#f5d9a0")
        (COVER_DIR / f"{spec['id']}.svg").write_text(cover_svg(spec, motif), encoding="utf-8")
        print(f"{spec['title']}：{mp3.name} {mp3.stat().st_size/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()