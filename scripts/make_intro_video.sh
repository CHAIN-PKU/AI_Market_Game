#!/bin/bash
# 把 5 张开场卡拼成一条 28 秒的介绍片：缓慢推近 + 交叉溶解（参考用户示例的节奏）
set -e
FFMPEG=${FFMPEG:-/tmp/dsh-rec/node_modules/ffmpeg-static/ffmpeg}
DIR=${1:-../runtime/intro}
OUT=${2:-../runtime/intro.mp4}
S=6          # 每张卡停留秒数
FPS=30

$FFMPEG -y \
  -i "$DIR/01.png" \
  -i "$DIR/02.png" \
  -i "$DIR/03.png" \
  -i "$DIR/04.png" \
  -i "$DIR/05.png" \
  -i "$DIR/06.png" \
  -filter_complex "\
[0:v]scale=1920:1080,zoompan=z='min(zoom+0.0007,1.05)':d=$((S*FPS)):s=1920x1080:fps=$FPS,setsar=1[v0];\
[1:v]scale=1920:1080,zoompan=z='min(zoom+0.0007,1.05)':d=$((S*FPS)):s=1920x1080:fps=$FPS,setsar=1[v1];\
[2:v]scale=1920:1080,zoompan=z='min(zoom+0.0007,1.05)':d=$((S*FPS)):s=1920x1080:fps=$FPS,setsar=1[v2];\
[3:v]scale=1920:1080,zoompan=z='min(zoom+0.0007,1.05)':d=$((S*FPS)):s=1920x1080:fps=$FPS,setsar=1[v3];\
[4:v]scale=1920:1080,zoompan=z='min(zoom+0.0007,1.05)':d=$((S*FPS)):s=1920x1080:fps=$FPS,setsar=1[v4];\
[5:v]scale=1920:1080,zoompan=z='min(zoom+0.0007,1.05)':d=$((S*FPS)):s=1920x1080:fps=$FPS,setsar=1[v5];\
[v0][v1]xfade=transition=fade:duration=0.7:offset=$((S-1))[x1];\
[x1][v2]xfade=transition=fade:duration=0.7:offset=$((2*S-2))[x2];\
[x2][v3]xfade=transition=fade:duration=0.7:offset=$((3*S-3))[x3];\
[x3][v4]xfade=transition=fade:duration=0.7:offset=$((4*S-4))[x4];\
[x4][v5]xfade=transition=fade:duration=0.7:offset=$((5*S-5))[x5]" \
  -map "[x5]" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium -movflags +faststart "$OUT"

echo "wrote $OUT"
