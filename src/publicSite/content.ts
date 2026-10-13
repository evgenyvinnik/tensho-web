import { TileSuit } from '../core/Tile'
import { HAND_BUILDING_PANELS, type GuideTileExample } from './handExample'

export interface GuideSection {
  id: string
  title: string
  paragraphs: string[]
  examples?: GuideTileExample[]
  action?: { label: string; path: string }
}

// Editorial review date, not automatically advanced by deployments.
export const PUBLIC_GUIDE_REVIEW_DATE = '2026-10-12'

export const PUBLIC_PAGES = {
  about: {
    label: 'About',
    title: 'About Tensho: a Mahjong roguelike',
    description:
      'Meet Tensho, a single-player browser roguelike of poker-style hands played with Mahjong tiles, big combos and rule-changing Decrees.',
    intro:
      'Familiar shapes. Unexpected combinations. Tensho takes the tiles of Mahjong into a single-player game about building a plan and adapting when the next draw changes it.',
    sections: [
      {
        id: 'what-is-tensho',
        title: 'What kind of game is Tensho?',
        paragraphs: [
          'Tensho is a browser-based roguelike played with Mahjong tiles. Instead of competing against other players at a traditional Mahjong table, you work toward round targets with a few Turns, and choose upgrades that change how your tiles score. A run is a sequence of decisions: which tiles to play now, what to keep, and which opportunities are worth chasing.',
          'Plays are read like poker hands, not by the rules of standard Mahjong: a Pair, Two Pairs, a Sequence, a Straight of four or five, a Triplet, a Quad, or a whole Mahjong hand. Those readable shapes are the whole vocabulary you need to start. You do not need to know any Japanese Mahjong hands before trying the game.',
        ],
      },
      {
        id: 'the-round',
        title: 'Two actions, one budget of Turns',
        paragraphs: [
          'Each round gives you a target score and a handful of Turns. Every Turn is one of two actions: Play hand scores the tiles you selected, and REDRAW sends any tiles you choose to the river and draws new ones. Reach the target before the Turns run out and you move on; clear a round with Turns to spare and you also earn an Omen.',
          'A play is worth its points times its Mult. Points come from the tiles and the groups they make; Mult grows with bigger hands, Dragons, Orbs and Decrees. Winds are worth a lot of points, Dragons add Mult, and big plays are meant to feel big. Between rounds, the Tea House offers Decrees, Orbs and other items that can reshape your run.',
        ],
      },
      {
        id: 'decrees',
        title: 'The scrolls are rules, not decorations',
        paragraphs: [
          'Decrees are upgrades represented by illustrated scrolls. Their descriptions tell you what changes: an extra reward for a particular group, more rack space, or a special way to form a sequence. Read the effect before choosing one, then ask which tiles it makes you want next.',
          'For example, Pair Devotee adds Mult whenever a play holds two or more Pairs, while Second Chance gives you a free REDRAW every round. Those are different reasons to change a decision, not simply different pictures of the same bonus. Tap any owned scroll to read it while you plan.',
        ],
      },
      {
        id: 'living-table',
        title: 'Flowers last; Seasons change the round',
        paragraphs: [
          'In Classic, collected Flowers remain with the run until an effect consumes them. They reward different patterns: Plum favors sequences, Orchid favors Honors, Chrysanthemum favors concealed melds, and Bamboo favors terminals. Eligible duplicate Flowers can awaken mutations, such as Plum letting two sequences share one physical tile. Inspect the Flowers you actually hold rather than assuming every mutation starts unlocked.',
          'Seasons affect the current round. Normal Spring adds rack spaces; Summer raises base score while setting aside part of the live wall; Autumn strengthens Yaku multipliers and grants a free REDRAW; Winter allows one-rank gaps in same-suit sequences but lowers score. A corrupted Season has a different rule, not all the benefits of its normal version. The Flora inspector shows the active stack and its interactions.',
          'Some Tea House Decrees offer a Flower as an alternative payment. Spending a Flower can remove its power and reduce set bonuses, so the confirmation explains the consequences. These are working run systems, not promises that every proposed mechanic in the design notes has shipped.',
        ],
      },
      {
        id: 'art',
        title: 'A table with its own atmosphere',
        paragraphs: [
          'Emerald felt, ivory tiles, warm gold and illustrated parchment shape Tensho’s visual world. Individual scrolls and table illustrations help you recognize what you own and where you are playing. Names and rules remain readable text rather than being baked into pictures.',
          'Some illustrations are created with AI image generation and integrated into the game alongside the existing tile and interface artwork. The illustration on this page is game-world art, not a gameplay screenshot. Motion and sound have settings so the atmosphere can remain a choice rather than an obstacle.',
        ],
      },
      {
        id: 'development',
        title: 'A game still being developed',
        paragraphs: [
          'Tensho is in active development. The current build includes playable runs, an illustrated “?” guide, shops, illustrated upgrades, a Codex, and connected Flower and Season powers. There is still work to do on balance, newcomer understanding, broader device coverage and artwork for every item; a working feature is not proof that every combination is enjoyable or fully verified.',
          'Automated checks help catch broken rules and controls, but they do not tell us whether a run is enjoyable. Reports about a confusing decision, an unhelpful upgrade or an unsatisfying loss are valuable feedback, not just bug reports.',
        ],
      },
    ] satisfies GuideSection[],
  },
  'how-to-play': {
    label: 'How to play',
    title: 'How to play Tensho',
    description:
      'Learn Tensho one decision at a time: recognize pairs, sequences and straights, read the hand score, choose between Play hand and REDRAW, and build toward bigger hands.',
    intro:
      'Start with one group you can recognize. You can learn the rest when it gives you a reason to make a different move.',
    sections: [
      {
        id: 'first-group',
        title: '1. Find a pair or a sequence',
        paragraphs: [
          'A pair is two matching tiles of the same type. A sequence is three consecutive numbered tiles in the same suit. Bamboo 3, Bamboo 4 and Bamboo 5 make a sequence. Bamboo 3, Circle 4 and Character 5 do not form an ordinary sequence, even though their ranks are consecutive.',
          'The numbered suits are Bamboo, Circles and Characters. Winds and Dragons are Honor tiles: matching copies can form sets, but they do not make ordinary numbered runs. Use the visual tile guide in the game if the symbols are unfamiliar.',
        ],
        examples: [
          {
            title: 'An ordinary sequence',
            groups: [
              { label: 'Bamboo 3–4–5', suit: TileSuit.Souzu, ranks: [3, 4, 5] },
            ],
            caption: 'Three consecutive ranks in one suit.',
          },
        ],
      },
      {
        id: 'play',
        title: '2. Select tiles and read the hand score',
        paragraphs: [
          'Tap rack tiles to select them. The hand score in the middle of the table shows what the selection would score right now: the hand it makes, its points and its Mult. Selecting is free; nothing is spent until you press a button.',
          'A play holds up to six tiles, or a whole Mahjong hand. The game reads your selection as the best hand it makes, so Two Pairs or a Sequence and a Pair score more than either group alone. A tile that belongs to no group still scores half its points.',
          'Compare a few selections before you commit. The interesting question is not only which score is larger, but which useful tiles will remain for your next Turn.',
        ],
      },
      {
        id: 'resources',
        title: '3. Play hand or REDRAW',
        paragraphs: [
          'Play hand scores the selected tiles, spends a Turn, and refills your rack. REDRAW sends any number of selected tiles to the river and draws replacements; it also spends a Turn, unless an item has given you a free redraw. Your last Turn is always a play.',
          'Redraw the loners and keep the tiles that already make a group. Some Decrees reward each REDRAW, a boss may forbid it for a round, and Seasons can change what it costs, so read the active effects before deciding.',
        ],
      },
      {
        id: 'build-a-hand',
        title: '4. Build toward a bigger hand',
        paragraphs: [
          'Bigger hands multiply better: every group after the first adds Mult, Triplets and Straights add more, and a complete Mahjong hand — four groups and a pair — adds the most. Instead of playing each small group as soon as it appears, you can keep useful groups and REDRAW spare tiles. Chasing a big hand can cost the round, so compare the score available now with the Turns you have left.',
          'Here is a controlled example. Keep the twelve tiles below and redraw the two unmatched Dragons. Two useful replacements can finish this shape, but random draws may not help. If the hand completes, select all fourteen tiles, check the hand score, and play it; forming the shape does not score automatically.',
        ],
        examples: HAND_BUILDING_PANELS,
        action: { label: 'Open Tensho to try it', path: 'en/play' },
      },
      {
        id: 'upgrades',
        title: '6. Buy an upgrade with a job to do',
        paragraphs: [
          'When you enter a shop, read the actual item and price. Ask, “What would I keep or play differently if I owned this?” A cheaper upgrade that supports a plan you can execute may be more useful than an impressive description you cannot activate.',
          'Consumables have their own use and targeting rules. Tap an item to read it and use it from there; choose tiles only when its effect needs them. Opening details or closing a panel is not the same as buying or using the item.',
        ],
      },
      {
        id: 'next-run',
        title: '7. Use a loss to find the next question',
        paragraphs: [
          'After a round, look for one decision you would change: an exchange used too early, a tile kept without a purpose, or an upgrade whose effect you never used. You do not need to solve every system at once. Start the next run with one thing to try.',
          'If you cannot tell why a move was rejected or what produced the final score, that is useful feedback for this developing game. Include the seed if available, language, screen size and the move you attempted when reporting it. Avoid sharing personal information from other browser tabs.',
        ],
      },
    ] satisfies GuideSection[],
  },
  faq: {
    label: 'Questions',
    title: 'Tensho questions and answers',
    description:
      'Answers about Tensho’s rules, Mahjong knowledge, controls, saved progress, local settings, generated artwork and current development status.',
    intro: 'The practical details before you sit down at the table.',
    sections: [
      {
        id: 'free',
        title: 'Can I try Tensho in my browser?',
        paragraphs: [
          'Yes. The current game is free to open and play in a browser, and starting a run does not require an account. Gold earned inside the game is a run resource, not a real-money wager. You do not need to install an app before trying it.',
        ],
      },
      {
        id: 'mahjong',
        title: 'Do I need to know Mahjong?',
        paragraphs: [
          'No. Tensho uses Mahjong tiles but plays poker-style hands with its own scoring. Begin with matching pairs and consecutive ranks in one suit; the “?” beside Exit shows every hand with an example. Familiarity with Mahjong helps you recognize tiles, but it is not a substitute for reading this game’s effects.',
        ],
      },
      {
        id: 'turns',
        title: 'What happened to Discard, Skip and the Riichi pledge?',
        paragraphs: [
          'They were removed to keep each Turn simple: Play hand or REDRAW. REDRAW replaces any number of tiles at once, so a separate single-tile Discard is no longer needed. Rounds cannot be skipped; clearing a Small or Large round with two Turns to spare earns the Omen that skipping used to. A run saved before the change is upgraded when you resume it.',
        ],
      },
      {
        id: 'mobile',
        title: 'Can I play on a phone?',
        paragraphs: [
          'The layouts and controls are being built for small and large screens. Tiles support tap selection, and details can be opened without a mouse. Short screens may scroll to keep tiles and actions usable. Automated mobile-browser checks do not cover every physical phone; a layout problem on your device is still worth reporting.',
        ],
      },
      {
        id: 'saves',
        title: 'What happens when I leave or reload?',
        paragraphs: [
          'Tensho checkpoints completed actions in local browser storage. Choose Save and leave to return to the menu, then Resume run to continue at your table or shop. An unfinished paid pack is included. A finished run is not offered for resuming; New Run starts the next one.',
          'Wait for Run saved before closing the tab. If saving fails, keep the tab open and use Retry saving. Selected tiles and animations are not restored, and a sudden browser or device shutdown can lose the newest actions. This is local recovery, not a cloud account or a guarantee against every interrupted write. Updates install themselves between runs, never in the middle of one.',
          'Local storage is specific to the browser and device. Clearing site data, using another browser, or a browser refusing storage can affect recovery. The Settings reset action is deliberate and separate from merely opening a help page.',
        ],
      },
      {
        id: 'motion',
        title: 'Can I reduce motion or turn sound off?',
        paragraphs: [
          'Settings include reduced motion and audio controls. The interface also responds to the system’s reduced-motion preference in supported components. Sound is optional; essential rules, actions and scores should remain understandable without it. Browser playback restrictions can mean music starts only after an interaction.',
        ],
      },
      {
        id: 'artwork',
        title: 'How is the artwork made?',
        paragraphs: [
          'Tensho combines its existing Mahjong tile/interface assets with individually integrated illustrations, including AI-generated scrolls and table imagery. The source repository records prompts and provenance for newer generated assets. Art gives items a recognizable identity; localized names and effect descriptions remain separate readable text.',
        ],
      },
      {
        id: 'finished',
        title: 'Is every documented mechanic finished?',
        paragraphs: [
          'Not every design proposal is a shipped feature. The game connects its normal and corrupted Season powers, Flower interactions, awakenings and eligible Flower-paid Decrees. The Table Loop experiment has been retired. Balance, newcomer experience, artwork for every item and broader device testing remain ongoing. The repository implementation notes separate published behavior, earlier checkpoints, proposals and verification gaps.',
        ],
      },
      {
        id: 'feedback',
        title: 'How can I give useful feedback?',
        paragraphs: [
          'Report the seed if shown, language, screen size and what you expected the action to do. For gameplay feedback, describe a decision that felt pointless, a combo that was satisfying, or a moment when you no longer knew what to aim for. The public source repository’s issue tracker is the place to start.',
        ],
      },
    ] satisfies GuideSection[],
  },
} as const

export type PublicPageId = keyof typeof PUBLIC_PAGES
