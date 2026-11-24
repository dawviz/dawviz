# Using an AI agent

[Contents](README.md) · [Tiếng Việt](../11-ai-agent.md)

You can ask an AI (Claude or another chatbot) to design the video: the AI writes a **preset** (a file describing the layers, when each one appears, precomps, keyframes and phases), you or the AI put it into the app, then export. Your project and audio files stay in your browser.

The instructions for the AI are the `dawviz` skill in the repo (`plugins/dawviz/skills/dawviz/SKILL.md`). In Claude Code: `/plugin marketplace add dawviz/dawviz`, then `/plugin install dawviz@dawviz`. For another AI, give it that SKILL.md file.

## Way 1: chat only

1. Tell the AI about the song (length, the sections and when they start, track names) and the video you want (vertical 9:16, wide 16:9, square).
2. The AI answers with a block of JSON. On the **Preview** tab, in the **Video styles** column, press **Paste preset**, paste the block, press **Add preset**.
3. If warnings show under the column, send them back to the AI to fix. Check it in the **Editor** tab, then **Export video**.

## Way 2: the AI drives the browser (for example Claude in Chrome)

Open the app with `?agent=1` added to its address: for the public build that is `https://dawviz.github.io/dawviz/app/?agent=1` (from source: `http://localhost:5173/?agent=1`). A strip at the top says an AI can control this window. The AI clicks buttons as you would, or calls the app directly; everything happens in front of you and can be undone with Ctrl+Z. You still pick the project file in the **Open file** dialog.

Without `?agent=1` the app opens no way for an AI to control it.

## Way 3: the AI has a terminal (for example Claude Code)

The AI runs a script that opens the app in a hidden Chrome, loads the project and audio, applies the preset, grabs a few frames to check its work and exports the video to a file. It needs Node 22 or newer; MP4 export needs a browser that can encode H.264: Google Chrome installed on the machine is the safest (the script tries Chrome first, then Playwright's Chromium; both gave MP4 H.264 on Linux when tested). A browser without H.264 gives WebM. Audio in the MP4 is AAC when the machine can encode it, otherwise Opus (Chrome and Firefox on Ubuntu currently only have Opus).

## Notes

- A preset holds no music files, track names or file paths, so it can be shared.
- The AI can only use what a preset can describe: it cannot add your pictures (the **Image** widget needs you to pick a file).
