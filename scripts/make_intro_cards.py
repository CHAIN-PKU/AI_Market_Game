#!/usr/bin/env python3
"""生成开场（5 幕）静态卡：米色底、左对齐大标题、右浮卡，参考用户给的示例视频风格。

用法: python3 scripts/make_intro_cards.py <out_dir>
输出: 01..05.png (1920x1080)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = '/System/Library/Fonts/Hiragino Sans GB.ttc'
PORTRAITS = ROOT / 'packages/web/public/assets/mixamo/portraits'
W, H = 1920, 1080
BG = (243, 234, 217)
INK = (43, 43, 40)
MUTED = (122, 112, 96)
ACCENT = (196, 85, 59)
CARD = (255, 253, 248)

CAST = [
    ('arissa', 'Astra', '谨慎型 · 先算最坏再报价'),
    ('medea-by-m-arrebola', 'Boreal', '稳健型 · 抢能做完的单'),
    ('aj', 'Cinder', '好奇型 · 新工具先试'),
    ('alex', 'Delta', '积极型 · 为买技能敢低价'),
    ('claire', 'Echo', '务实型 · 数据够才开口'),
    ('ty', 'Flux', '平衡型 · 好看和好用都要'),
    ('akai-e-espiritu', 'Grove', '稳健型 · 长期能力优先'),
    ('lola-b-styperek', 'Helix', '观察型 · 先看别人怎么输'),
]

STEPS = [
    ('1', '发单', '市集挂出一张单：奖励 100，难度 40'),
    ('2', '抢单', '8 个 AI 自己算账：接不接、报多少、拉谁组队'),
    ('3', '到手', '奖励 − 税 = 到手，数字当场结算'),
    ('4', '变强', '拿钱训练自己：能力 +4，下轮成功率跟着涨'),
]


def f(size, weight=None):
    return ImageFont.truetype(FONT, size)


def base_canvas():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    # 极轻的暖色渐变，避免纯平
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=(int(246 - 6 * t), int(238 - 7 * t), int(222 - 9 * t)))
    return img


def shadowed_card(img, box, radius=18, shadow=28):
    x0, y0, x1, y1 = box
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([x0 + 6, y0 + 16, x1 + 6, y1 + 16], radius=radius, fill=(90, 74, 48, 46))
    layer = layer.filter(ImageFilter.GaussianBlur(shadow))
    img.paste(Image.alpha_composite(img.convert('RGBA'), layer).convert('RGB'), (0, 0))
    d2 = ImageDraw.Draw(img)
    d2.rounded_rectangle(box, radius=radius, fill=CARD)


def paste_screenshot(img, path, box, crop=None):
    try:
        shot = Image.open(path).convert('RGB')
    except Exception:
        return
    if crop:
        shot = shot.crop(crop)
    tw, th = box[2] - box[0] - 28, box[3] - box[1] - 28
    scale = max(tw / shot.width, th / shot.height)
    shot = shot.resize((int(shot.width * scale), int(shot.height * scale)), Image.LANCZOS)
    left = (shot.width - tw) // 2
    top = (shot.height - th) // 2
    shot = shot.crop((left, top, left + tw, top + th))
    img.paste(shot, (box[0] + 14, box[1] + 14))


def accent_bar(d, x, y):
    d.rounded_rectangle([x, y, x + 64, y + 7], radius=4, fill=ACCENT)


def wrap(d, text, font, max_w):
    lines, cur = [], ''
    for ch in text:
        if d.textlength(cur + ch, font=font) > max_w:
            lines.append(cur)
            cur = ch
        else:
            cur += ch
    if cur:
        lines.append(cur)
    return lines


def text_block(d, x, top, title, subs, title_size=76, sub_size=42, accent=True):
    y = top
    if accent:
        accent_bar(d, x, y - 46)
    for i, line in enumerate(title):
        d.text((x, y), line, font=f(title_size), fill=INK)
        y += int(title_size * 1.32)
    y += 18
    for line in subs:
        d.text((x, y), line, font=f(sub_size), fill=MUTED)
        y += int(sub_size * 1.5)


def soft_scene(img, path, box, radius=22, alpha=150):
    """右侧放一张柔化的场景图，只用来看出"这是一座活的岛"，不抢字。"""
    try:
        shot = Image.open(path).convert('RGB')
    except Exception:
        return
    tw, th = box[2] - box[0], box[3] - box[1]
    scale = max(tw / shot.width, th / shot.height)
    shot = shot.resize((int(shot.width * scale) + 1, int(shot.height * scale) + 1), Image.LANCZOS)
    left = (shot.width - tw) // 2
    top = (shot.height - th) // 2
    shot = shot.crop((left, top, left + tw, top + th))
    mask = Image.new('L', (tw, th), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, tw - 1, th - 1], radius=radius, fill=alpha)
    img.paste(shot, (box[0], box[1]), mask)


def card1(path, scene=None):
    """立身份：你是制度设计师"""
    img = base_canvas()
    if scene:
        soft_scene(img, scene, (1050, 230, 1840, 850), alpha=170)
    d = ImageDraw.Draw(img)
    text_block(d, 120, 380, ['你是制度设计师。'], [
        '这座岛上的 8 个 AI，听你的规则。',
        '你不用操作任何人。',
    ])
    img.save(path)


def card2(path, shot):
    """只做一件事：发一张单"""
    img = base_canvas()
    d = ImageDraw.Draw(img)
    text_block(d, 120, 330, ['你只做一件事：', '发一张单。'], [
        '奖励 100 金，难度 40，谁能接？',
        '剩下的，交给它们自己。',
    ], title_size=66)
    box = (900, 250, 1810, 830)
    shadowed_card(img, box)
    paste_screenshot(img, shot, box, crop=(360, 240, 1360, 860))
    img.save(path)


def card3(path, shot):
    """它们自己算账"""
    img = base_canvas()
    d = ImageDraw.Draw(img)
    text_block(d, 120, 210, ['它们自己算账。'], [
        '有人抢低价，有人等别人先出错，',
        '有人拉人组队，也有人准备独吞。',
        '你只是看着，什么也不用做。',
    ], title_size=62, sub_size=38)
    box = (980, 300, 1830, 830)
    shadowed_card(img, box)
    paste_screenshot(img, shot, box, crop=(700, 200, 1500, 800))
    img.save(path)


def card4(path, shot):
    """消费＝自我进化"""
    img = base_canvas()
    d = ImageDraw.Draw(img)
    text_block(d, 120, 250, ['赚到的钱，', '它们自己决定怎么花。'], [
        '买技能、练能力——消费就是进化。',
        '能力变了，下一轮的结果就不一样。',
    ], title_size=60, sub_size=38)
    box = (900, 240, 1810, 850)
    shadowed_card(img, box)
    paste_screenshot(img, shot, box, crop=(560, 240, 1360, 840))
    img.save(path)


def card5(path, shot):
    """你改一条规则"""
    img = base_canvas()
    d = ImageDraw.Draw(img)
    text_block(d, 120, 250, ['然后，你改一条规则。'], [
        '税率调一点，或者把技能共享打开——',
        '整座岛的行为，跟着变。',
    ], title_size=62, sub_size=38)
    box = (940, 430, 1830, 900)
    shadowed_card(img, box)
    paste_screenshot(img, shot, box, crop=(0, 40, 780, 800))
    img.save(path)


def card6(path, scene=None):
    """收尾"""
    img = base_canvas()
    if scene:
        soft_scene(img, scene, (1080, 200, 1860, 880), alpha=120)
    d = ImageDraw.Draw(img)
    text_block(d, 120, 420, ['换一条规则，', '换一个社会。'], [
        '下面这一轮，是它们自己跑出来的。',
    ], title_size=72, sub_size=40)
    img.save(path)


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'runtime/intro'
    out.mkdir(parents=True, exist_ok=True)
    shots = ROOT.parent / 'runtime'
    card1(out / '01.png', str(shots / 'bubbles-lift.png'))
    card2(out / '02.png', str(shots / 'story-task.png'))
    card3(out / '03.png', str(shots / 'bubbles-lift.png'))
    card4(out / '04.png', str(shots / 'evolution-panel.png'))
    card5(out / '05.png', str(ROOT / 'docs/screenshots/visual-rebuild/institution-compare-1920.png'))
    card6(out / '06.png', str(shots / 'story-money.png'))
    print('cards written to', out)


if __name__ == '__main__':
    main()
