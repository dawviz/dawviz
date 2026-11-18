# Ghi công (Credits)

## Tác giả

| Người | Vai trò |
|---|---|
| sonarx | Chủ dự án: ý tưởng, thiết kế sản phẩm, quyết định, kiểm thử |
| Claude (Anthropic) | Trợ lý AI: viết mã, tài liệu và test cùng chủ dự án |

Người đóng góp mới (mã, bản dịch, preset, tài nguyên) được thêm vào bảng này. Cách đóng góp: [CONTRIBUTING.md](CONTRIBUTING.md).

## Phong cách video

**Bản in (Paper)** dựa theo cách trình bày video của kênh YouTube **Usagin_P**, một nhà soạn nhạc người Việt Nam chuyên sáng tác bài gốc và remix:

- YouTube: https://www.youtube.com/@Usagin_P
- SoundCloud: https://soundcloud.com/usagin-p
- Spotify: https://open.spotify.com/artist/02OwmOseyXmrcLuf3mqLYT

Dự án không liên kết với kênh. Nhạc của Usagin_P không có trong repo này; muốn dùng nhạc đó hãy theo điều kiện tác giả ghi trên kênh.

## Tham chiếu định dạng

- Cấu trúc byte của tệp FL Studio (`.flp`: id sự kiện, kích thước nốt và clip Playlist) được đối chiếu với mô tả công khai của [DAWVert](https://github.com/SatyrDiamond/DawVert) của SatyrDiamond (GPL-3.0-or-later) rồi kiểm lại bằng tệp thật. **Không sao chép mã**; schema `schemas/flp.schema.json` và engine do dự án tự viết. Chi tiết: [docs/spikes/SPIKE-3-FLP.md](docs/spikes/SPIKE-3-FLP.md).

## Phông chữ

- Space Grotesk (chữ trong video) và Inter (giao diện): SIL Open Font License 1.1, giấy phép kèm trong `apps/web/public/fonts/`.

---

# Credits (English)

## Authors

| Who | Role |
|---|---|
| sonarx | Project owner: idea, product design, decisions, testing |
| Claude (Anthropic) | AI assistant: code, documentation and tests, together with the owner |

New contributors (code, translations, presets, assets) are added to this table. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Video styles

**Paper** is based on the video look of the YouTube channel **Usagin_P**, a Vietnamese composer of original tracks and remixes:

- YouTube: https://www.youtube.com/@Usagin_P
- SoundCloud: https://soundcloud.com/usagin-p
- Spotify: https://open.spotify.com/artist/02OwmOseyXmrcLuf3mqLYT

This project is not affiliated with the channel. Usagin_P's music is not included in this repository; to use it, follow the terms the author gives on the channel.

## Format references

- The byte layout of FL Studio project files (`.flp`: event ids, note and Playlist-clip sizes) was cross-checked against the public documentation in SatyrDiamond's [DAWVert](https://github.com/SatyrDiamond/DawVert) (GPL-3.0-or-later) and then verified against a real file. **No code was copied**: `schemas/flp.schema.json` and the engine are written by this project. Details: [docs/spikes/SPIKE-3-FLP.md](docs/spikes/SPIKE-3-FLP.md).

## Fonts

- Space Grotesk (video text) and Inter (interface): SIL Open Font License 1.1, licences included in `apps/web/public/fonts/`.
