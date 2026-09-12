export interface GuideSection {
  id: string
  title: string
  paragraphs: string[]
  tiles?: { suit: 'Bamboo' | 'Dots' | 'Symbol'; rank: number }[]
}

export const PUBLIC_PAGES = {
  about: {
    label: 'About',
    title: 'About Tensho: a Mahjong roguelike',
    description: 'Meet Tensho, a single-player browser game built around Mahjong tiles, evolving combinations and rule-changing Decrees. Compare Classic and Table Loop.',
    intro: 'Familiar shapes. Unexpected combinations. Tensho takes the tiles of Mahjong into a single-player game about building a plan and adapting when the next draw changes it.',
    sections: [
      { id: 'what-is-tensho', title: 'What kind of game is Tensho?', paragraphs: [
        'Tensho is a browser-based Mahjong roguelike. Instead of competing against other players at a traditional Mahjong table, you work toward round objectives, manage a limited supply of actions, and choose upgrades that change how your tiles behave. A run is a sequence of decisions: which tiles to use now, what to keep, and which opportunities are worth pursuing.',
        'It is not a tile-matching solitaire game. You are looking for groups: matching pairs, three matching tiles, or runs of consecutive ranks in one suit. Those small, readable shapes are the starting vocabulary. You do not need to memorize a complete list of Japanese Mahjong hands before trying the game.',
      ]},
      { id: 'two-modes', title: 'Two ways to approach the table', paragraphs: [
        'Classic uses a changing rack and a score target. Stage a small tactical play, inspect the forecast, and commit it to score and draw replacements. A complete Mahjong hand is a separate, deliberate declaration. Between cleared rounds, the Tea House offers Decrees and other items that can reshape your run.',
        'Table Loop is a separate three-round experiment. Groups stay on the table in four meld slots and a pair slot. Your next placement can connect with what you already built, and visible milestones reward patterns across groups. Revising a group has a cost, so the table records both progress and commitment.',
        'Neither mode is a simulation of competitive Riichi Mahjong. Tensho borrows tiles and pattern language, then introduces its own scoring, resources and upgrade rules. Classic and Table Loop also have different rules from one another; their upgrades and run states are not interchangeable.',
      ]},
      { id: 'decrees', title: 'The scrolls are rules, not decorations', paragraphs: [
        'Decrees are upgrades represented by illustrated scrolls. Their descriptions tell you what changes: an extra reward for a particular group, more rack space, or a special way to form a sequence. Read the effect before choosing one, then ask which tiles it makes you want next.',
        'For example, Table Loop’s Echoing Bamboo makes a Bamboo sequence score twice when placed. Wide Rack gives you room for two more tiles. Those are different reasons to change a decision, not simply different pictures of the same bonus. Owned scroll details can be opened while you inspect your build.',
      ]},
      { id: 'art', title: 'A table with its own atmosphere', paragraphs: [
        'Emerald felt, ivory tiles, warm gold and illustrated parchment shape Tensho’s visual world. Individual scrolls and table illustrations help you recognize what you own and where you are playing. Names and rules remain readable text rather than being baked into pictures.',
        'Some illustrations are created with AI image generation and integrated into the game alongside the existing tile and interface artwork. The illustration on this page is game-world art, not a gameplay screenshot. Motion and sound have settings so the atmosphere can remain a choice rather than an obstacle.',
      ]},
      { id: 'development', title: 'A game still being developed', paragraphs: [
        'Tensho is in active development. The current build includes playable runs, an optional teaching experience, shops, illustrated upgrades and a game reference called the Codex. Some documented Classic Flower and Season powers are still being connected; the inspector identifies unfinished effects rather than presenting them as working rewards.',
        'Table Loop is explicitly an experiment in making plans and combinations easier to see. Automated checks help catch broken rules and controls, but they do not tell us whether a run is enjoyable. Reports about a confusing decision, an unhelpful upgrade or an unsatisfying loss are valuable feedback, not just bug reports.',
      ]},
    ] satisfies GuideSection[],
  },
  'how-to-play': {
    label: 'How to play',
    title: 'How to play Tensho',
    description: 'Learn Tensho one decision at a time: recognize pairs and sequences, stage tiles, read your score forecast, and choose between Classic and Table Loop.',
    intro: 'Start with one group you can recognize. You can learn the rest when it gives you a reason to make a different move.',
    sections: [
      { id: 'first-group', title: '1. Find a pair or a sequence', paragraphs: [
        'A pair is two matching tiles of the same type. A sequence is three consecutive numbered tiles in the same suit. Bamboo 3, Bamboo 4 and Bamboo 5 make a sequence. Bamboo 3, Circle 4 and Character 5 do not form an ordinary sequence, even though their ranks are consecutive.',
        'The numbered suits are Bamboo, Circles and Characters. Winds and Dragons are Honor tiles: matching copies can form sets, but they do not make ordinary numbered runs. Use the visual tile guide in the game if the symbols are unfamiliar.',
      ], tiles: [{ suit: 'Bamboo', rank: 3 }, { suit: 'Bamboo', rank: 4 }, { suit: 'Bamboo', rank: 5 }] },
      { id: 'stage', title: '2. Stage first, then decide', paragraphs: [
        'In Classic, tapping or clicking a rack tile moves it to the staging area. You are arranging a possible play, not spending it yet. Returning a staged tile to the rack or clearing the selection lets you change your mind.',
        'Read the score forecast and the action’s availability before committing. An ordinary tactical play uses two to five tiles; a larger selection needs to satisfy complete-hand rules. Stage Hand is not an unlimited play-everything shortcut: it prepares a declaration that still needs confirmation.',
        'Try comparing a recognizable group with a different selection. The interesting question is not only which forecast is larger, but what useful tiles will remain afterward. Do not spend a tile you are building around without checking what that costs your next move.',
      ]},
      { id: 'resources', title: '3. Distinguish playing, discarding and redrawing', paragraphs: [
        'A Classic play scores the staged tiles, spends a Hand, and draws replacements under the active rules. Your objective is to reach the round target before you run out of useful opportunities. Unrelated loose tiles can contribute some points, but recognizing groups gives you more to work with.',
        'A discard sends a tile to the river and uses a discard. A redraw exchanges up to three selected tiles and spends a redraw rather than a Hand. Redrawn tiles return to the wall after replacement, so the same physical tile is not its own immediate replacement. Locks and bonus-tile chains can make a proposed exchange unavailable.',
        'These actions are not interchangeable. A Decree may reward discards, a boss may restrict your choices, or a Season may penalize them. Read the active effect and remaining resource count instead of assuming that a familiar button always has the same strategic value.',
      ]},
      { id: 'table-loop', title: '4. Try building across turns in Table Loop', paragraphs: [
        'Choose a starter Decree, then place recognized groups into the table’s meld and pair slots. A pair fits the pair slot; sequences and matching sets fit meld slots. Unlike Classic, placed groups stay visible and can combine with later placements to create milestones.',
        'Inspect a placement’s forecast before committing. An empty slot and a revision of an occupied slot are not equivalent: revising can surrender value or break a standing pattern. You are building a table, not repeatedly scoring the same slot for free.',
        'The optional practice deal introduces a small number of decisions and explains the pattern after you make it. The ordinary mode then uses seeded play. A separate offers-row variant provides face-up tile choices; it is optional and is not the default rule.',
      ]},
      { id: 'upgrades', title: '5. Buy an upgrade with a job to do', paragraphs: [
        'When you enter a shop, read the actual item and price. Ask, “What would I keep or play differently if I owned this?” A cheaper upgrade that supports a plan you can execute may be more useful than an impressive description you cannot activate.',
        'Classic consumables have their own use and targeting rules. Inspect the item, choose valid targets when required, and confirm only when the effect and any penalty make sense. Opening details or cancelling a dialog is not the same as buying or consuming the item.',
        'Keep expectations specific to the mode you chose. Table Loop’s smaller Decree pool and persistent groups are not the complete Classic item system. The in-game Codex and item descriptions provide the rules relevant to the current screen.',
      ]},
      { id: 'next-run', title: '6. Use a loss to find the next question', paragraphs: [
        'After a round, look for one decision you would change: an exchange used too early, a tile kept without a purpose, or an upgrade whose effect you never used. You do not need to solve every system at once. Start the next run with one thing to try.',
        'If you cannot tell why a move was rejected or what produced the final score, that is useful feedback for this developing game. Include the mode, seed if available, language, screen size and the move you attempted when reporting it. Avoid sharing personal information from other browser tabs.',
      ]},
    ] satisfies GuideSection[],
  },
  faq: {
    label: 'Questions',
    title: 'Tensho questions and answers',
    description: 'Answers about Tensho’s game modes, Mahjong knowledge, controls, saved progress, local settings, generated artwork and current development status.',
    intro: 'The practical details before you sit down at the table.',
    sections: [
      { id: 'free', title: 'Can I try Tensho in my browser?', paragraphs: ['Yes. The current game is free to open and play in a browser, and starting a run does not require an account. Gold earned inside the game is a run resource, not a real-money wager. You do not need to install an app before trying it.'] },
      { id: 'mahjong', title: 'Do I need to know Mahjong?', paragraphs: ['No prior Mahjong knowledge is required to try the teaching experience. Begin with matching pairs and consecutive ranks in one suit. Tensho has its own scoring and upgrade rules; familiarity with Riichi Mahjong can help you recognize tiles, but it is not a substitute for reading this game’s effects.'] },
      { id: 'modes', title: 'Why are there two modes?', paragraphs: ['Classic is the broader run with tactical plays, complete-hand declarations, shops and consumables. Table Loop is a separate short experiment where groups remain on the table. It tests whether visible progress across turns makes planning easier to understand. Choose a mode intentionally rather than expecting one to resume the other’s run.'] },
      { id: 'mobile', title: 'Can I play on a phone?', paragraphs: ['The layouts and controls are being built for small and large screens. Tiles support tap selection, and details can be opened without a mouse. Short screens may scroll to keep tiles and actions usable. Automated mobile-browser checks do not cover every physical phone; a layout problem on your device is still worth reporting.'] },
      { id: 'saves', title: 'What happens when I leave or reload?', paragraphs: ['Table Loop records its run locally in the browser and can resume a saved run. Preferences and earned progression also use local browser storage. Do not assume that an active Classic hand has the same reload recovery as Table Loop. Classic’s Exit confirmation warns that current run progress will be lost.', 'Local storage is specific to the browser and device. Clearing site data, using another browser, or a browser refusing storage can affect recovery. The Settings reset action is deliberate and separate from merely opening a help page.'] },
      { id: 'motion', title: 'Can I reduce motion or turn sound off?', paragraphs: ['Settings include reduced motion and audio controls. The interface also responds to the system’s reduced-motion preference in supported components. Sound is optional; essential rules, actions and scores should remain understandable without it. Browser playback restrictions can mean music starts only after an interaction.'] },
      { id: 'artwork', title: 'How is the artwork made?', paragraphs: ['Tensho combines its existing Mahjong tile/interface assets with individually integrated illustrations, including AI-generated scrolls and table imagery. The source repository records prompts and provenance for newer generated assets. Art gives items a recognizable identity; localized names and effect descriptions remain separate readable text.'] },
      { id: 'finished', title: 'Is every documented mechanic finished?', paragraphs: ['No. The project is in active development. Some Classic Flower and Season powers are still incomplete, and Table Loop remains an experimental alternative rather than a replacement for every Classic system. The implementation notes in the repository distinguish working behavior from proposals and verification gaps.'] },
      { id: 'feedback', title: 'How can I give useful feedback?', paragraphs: ['Report the mode, seed if shown, language, screen size and what you expected the action to do. For gameplay feedback, describe a decision that felt pointless, a combo that was satisfying, or a moment when you no longer knew what to aim for. The public source repository’s issue tracker is the place to start.'] },
    ] satisfies GuideSection[],
  },
} as const

export type PublicPageId = keyof typeof PUBLIC_PAGES
