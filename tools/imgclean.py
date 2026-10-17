from collections import deque

from PIL import Image, ImageFilter

DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))
ALPHA_OPAQUE = 128


def _is_light(d):
    r, g, b, a = d
    return (r + g + b) / 3 >= 168 and (max(r, g, b) - min(r, g, b)) <= 48


def erode_alpha(img, px=1):
    alpha = img.getchannel("A").filter(ImageFilter.MinFilter(px * 2 + 1))
    img.putalpha(alpha)
    return img


def dilate_alpha(img, px=1):
    alpha = img.getchannel("A").filter(ImageFilter.MaxFilter(px * 2 + 1))
    img.putalpha(alpha)
    return img


def fill_holes(img):
    w, h = img.size
    n = w * h
    data = list(img.getdata())
    opaque = bytearray(n)
    for i in range(n):
        if data[i][3] >= ALPHA_OPAQUE:
            opaque[i] = 1

    outside = bytearray(n)
    queue = deque()

    def seed(i):
        if not opaque[i] and not outside[i]:
            outside[i] = 1
            queue.append(i)

    for x in range(w):
        seed(x)
        seed((h - 1) * w + x)
    for y in range(h):
        seed(y * w)
        seed(y * w + w - 1)

    while queue:
        j = queue.popleft()
        x, y = j % w, j // w
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if not opaque[k] and not outside[k]:
                    outside[k] = 1
                    queue.append(k)

    known = bytearray(n)
    fill = bytearray(n)
    for i in range(n):
        if opaque[i]:
            known[i] = 1
        elif not outside[i]:
            fill[i] = 1

    order = deque()
    queued = bytearray(n)
    for i in range(n):
        if not fill[i]:
            continue
        x, y = i % w, i // w
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and known[ny * w + nx]:
                order.append(i)
                queued[i] = 1
                break

    while order:
        i = order.popleft()
        x, y = i % w, i // w
        rs = gs = bs = cnt = 0
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if known[k]:
                    d = data[k]
                    rs += d[0]
                    gs += d[1]
                    bs += d[2]
                    cnt += 1
        if cnt:
            data[i] = (rs // cnt, gs // cnt, bs // cnt, 255)
        known[i] = 1
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if fill[k] and not known[k] and not queued[k]:
                    queued[k] = 1
                    order.append(k)

    out = Image.new("RGBA", (w, h))
    out.putdata(data)
    return out


def defringe(img, rounds=3):
    w, h = img.size
    for _ in range(rounds):
        data = list(img.getdata())
        opaque = bytearray(w * h)
        for i in range(w * h):
            if data[i][3] >= ALPHA_OPAQUE:
                opaque[i] = 1
        newdata = list(data)
        changes = 0
        for y in range(h):
            for x in range(w):
                i = y * w + x
                if not opaque[i] or not _is_light(data[i]):
                    continue
                edge = False
                for dx, dy in DIRS:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not opaque[ny * w + nx]:
                        edge = True
                        break
                if not edge:
                    continue
                rs = gs = bs = cnt = 0
                for dx, dy in DIRS:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        k = ny * w + nx
                        if opaque[k] and not _is_light(data[k]):
                            d = data[k]
                            rs += d[0]
                            gs += d[1]
                            bs += d[2]
                            cnt += 1
                if cnt:
                    newdata[i] = (rs // cnt, gs // cnt, bs // cnt, 255)
                    changes += 1
        img = Image.new("RGBA", (w, h))
        img.putdata(newdata)
        if changes == 0:
            break
    return img


def bleed_colors(img):
    w, h = img.size
    n = w * h
    data = list(img.getdata())
    known = bytearray(n)
    for i in range(n):
        if data[i][3] >= ALPHA_OPAQUE:
            known[i] = 1

    order = deque()
    queued = bytearray(n)
    for i in range(n):
        if known[i]:
            continue
        x, y = i % w, i // w
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and known[ny * w + nx]:
                order.append(i)
                queued[i] = 1
                break

    while order:
        i = order.popleft()
        x, y = i % w, i // w
        rs = gs = bs = cnt = 0
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if known[k]:
                    d = data[k]
                    rs += d[0]
                    gs += d[1]
                    bs += d[2]
                    cnt += 1
        if cnt:
            data[i] = (rs // cnt, gs // cnt, bs // cnt, 0)
        known[i] = 1
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if not known[k] and not queued[k]:
                    queued[k] = 1
                    order.append(k)

    out = Image.new("RGBA", (w, h))
    out.putdata(data)
    return out


def smooth_alpha(img, radius=0.6):
    alpha = img.getchannel("A").filter(ImageFilter.GaussianBlur(radius))
    img.putalpha(alpha)
    return img


def clean(img):
    img = fill_holes(img)
    img = erode_alpha(img, 3)
    img = dilate_alpha(img, 3)
    img = erode_alpha(img, 2)
    img = defringe(img, rounds=10)
    img = bleed_colors(img)
    return smooth_alpha(img, radius=0.45)


def main():
    import sys
    from pathlib import Path

    for arg in sys.argv[1:]:
        p = Path(arg)
        out = clean(Image.open(p).convert("RGBA"))
        out.save(p)
        print(f"limpiado {p} {out.size}")


if __name__ == "__main__":
    main()
