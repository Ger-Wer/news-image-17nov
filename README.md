# 17 November 2026 — World News in One Image

[![make.fun](https://make.fun/badge/news-image-20261117.svg)](https://make.fun/c/news-image-20261117)
[![rank](https://make.fun/badge/news-image-20261117/Ger-Wer/news-image-17nov/rank.svg)](https://make.fun/c/news-image-20261117)
[![reward](https://make.fun/badge/news-image-20261117/Ger-Wer/news-image-17nov/reward.svg)](https://make.fun/c/news-image-20261117)

One 1024×1024 PNG summing up the world news of Tuesday 17 November 2026,
drawn procedurally with plain Node.js (own rasteriser, own 5×7 bitmap font,
own PNG encoder — standard library only, no network, no dependencies).

## The five stories

1. **Ukraine** — Kerch Bridge hit for a second day: roadway collapsed, traffic
   halted; Kyiv's bridges struck, heat, water and power cut.
2. **Middle East** — tankers hit by mines and burning near the Strait of Hormuz;
   drones at the US base in Bahrain intercepted; carrier USS Theodore Roosevelt
   arrives in the region.
3. **China** — Xi, Trump and Putin to meet for the first time three-way:
   19 November in Shenzhen, at the APEC summit.
4. **USA** — Pentagon fails its financial audit for the 9th year in a row:
   over $4.8 trillion unverified.
5. **USA** — the country loses its measles-free status: most cases since 1991;
   13 babies born with measles.

## Files

- `entry.png` — the image (1024×1024, under 1 MiB)
- `gen.mjs` — draws `entry.png` from scratch (deterministic)
- `main.ts` — the entry program: copies `entry.png` to `$MAKEFUN_OUTPUT_DIR`

## Run

```sh
node gen.mjs            # regenerate entry.png
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Two runs of `main.ts` produce byte-identical output.

## Competition

[news-image-20261117 on make.fun](https://make.fun/c/news-image-20261117)
