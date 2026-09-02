// lib/utils/commentaryGenerator.ts

interface RunCommentaryParams {
  bowlerName: string;
  batsmanName: string;
  runs: number;
}

interface WicketCommentaryParams {
  bowlerName: string;
  batsmanName: string;
  dismissalType: string;
  runsCompleted?: number;
}

interface ExtraCommentaryParams {
  bowlerName: string;
  batsmanName: string;
  type: string;
  totalRuns: number;
}

// 🎯 রান ও বাউন্ডারি ধারাভাষ্য (বাস্তবসম্মত বৈচিত্র্য সহ)
export function generateRunCommentary({
  bowlerName,
  batsmanName,
  runs,
}: RunCommentaryParams): string {
  const bName = bowlerName || "Bowler";
  const batName = batsmanName || "Batsman";

  if (runs === 0) {
    const dotPhrases = [
      `${bName} to ${batName}, no run. Defended solidly back down the pitch.`,
      `${bName} keeps it tight outside off, ${batName} shoulders arms safely.`,
      `${bName} bowls on a good length, pushed gently towards cover. Dot ball.`,
      `${bName} to ${batName}, beaten! Excellent seam movement past the outside edge.`,
      `${bName} darts it in full, ${batName} jams it down to mid-on. No run.`,
    ];
    return dotPhrases[Math.floor(Math.random() * dotPhrases.length)];
  }

  if (runs === 1) {
    const singlePhrases = [
      `${bName} to ${batName}, 1 run. Pushed into the gap at mid-wicket to rotate strike.`,
      `${bName} angles it in, guided softly down towards third man for a comfortable single.`,
      `${bName} to ${batName}, tapped gently in front of point for a quick single. Good running!`,
      `${bName} lands it full, driven down to long-on for an easy single.`,
    ];
    return singlePhrases[Math.floor(Math.random() * singlePhrases.length)];
  }

  if (runs === 2) {
    const doublePhrases = [
      `${bName} to ${batName}, 2 runs. Clipped into the deep mid-wicket pocket, fast legs turn 1 into 2!`,
      `${bName} drops it short, pulled behind square. They hurry back and complete the second easily.`,
      `${bName} to ${batName}, punched off the back foot through covers. Excellent running between the wickets!`,
    ];
    return doublePhrases[Math.floor(Math.random() * doublePhrases.length)];
  }

  if (runs === 3) {
    return `${bName} to ${batName}, 3 runs. Superb placement into the deep! The outfield slows it down just in time.`;
  }

  if (runs === 4) {
    const fourPhrases = [
      `FOUR! ${batName} leans into the drive and threads the gap through extra cover! Pure class.`,
      `FOUR! Smashed with authority! ${bName} misses the length and pays the price.`,
      `FOUR! Edged but safe! Soft hands and it races past the slip cordon to the third man fence.`,
      `FOUR! Short, wide, and punished! ${batName} cuts it fiercely past backward point.`,
      `FOUR! Dispatched! ${batName} charges down the ground and hammers it straight past mid-off.`,
    ];
    return fourPhrases[Math.floor(Math.random() * fourPhrases.length)];
  }

  if (runs === 6) {
    const sixPhrases = [
      `SIX! High, handsome, and into the crowd! ${batName} smokes ${bName} way over long-on!`,
      `SIX! Dispatched with sheer power! Sits back and pulls it deep into the square leg stands!`,
      `SIX! Effortless timing! Picked up cleanly off the pads and sailed over deep mid-wicket!`,
      `SIX! Maximum! Dances down the track and lofts it cleanly inside-out over extra cover!`,
    ];
    return sixPhrases[Math.floor(Math.random() * sixPhrases.length)];
  }

  return `${bName} to ${batName}, ${runs} runs taken.`;
}

// 🎯 উইকেট ধারাভাষ্য (সঠিক ক্রিকেট পরিভাষা সহ)
export function generateWicketCommentary({
  bowlerName,
  batsmanName,
  dismissalType,
  runsCompleted = 0,
}: WicketCommentaryParams): string {
  const bName = bowlerName || "Bowler";
  const batName = batsmanName || "Batsman";

  switch (dismissalType) {
    case "Bowled":
      return `OUT! BOWLED HIM! Through the gate! ${bName} rattles the timber and ${batName} has to walk back!`;

    case "Caught": {
      const caughtPhrases = [
        `OUT! In the air... and TAKEN! Mistimed shot and the fielder under it makes no mistake! ${batName} departs off ${bName}'s bowling.`,
        `OUT! CAUGHT! Edged and gone! Safe pair of hands behind the stumps/slips. Big breakthrough for ${bName}!`,
        `OUT! Caught in the deep! Tried to go big over the ropes but finds the fielder stationed at the boundary!`,
      ];
      return caughtPhrases[Math.floor(Math.random() * caughtPhrases.length)];
    }

    case "LBW":
      return `OUT! Loud shout for LBW and the umpire raises the finger! Plumb in front off ${bName}. ${batName} is trapped!`;

    case "Run Out": {
      const runText = runsCompleted > 0 ? ` (${runsCompleted} runs completed)` : "";
      return `OUT! RUN OUT! Chaos between the wickets and a direct hit seals it! ${batName} is caught short of the crease${runText}.`;
    }

    case "Stumped":
      return `OUT! STUMPED! Beaten by flight, out of the crease, and the keeper whips off the bails in a flash!`;

    case "Hit Wicket":
      return `OUT! Hit Wicket! Dreadful way to go as ${batName} steps back and disturbs his own bails!`;

    default:
      return `OUT! ${dismissalType} - ${batName} falls to the bowling of ${bName}.`;
  }
}

// 🎯 এক্সট্রা (Wide, No Ball, Byes) ধারাভাষ্য
export function generateExtraCommentary({
  bowlerName,
  batsmanName,
  type,
  totalRuns,
}: ExtraCommentaryParams): string {
  const bName = bowlerName || "Bowler";
  const batName = batsmanName || "Batsman";

  if (type === "Wide") {
    return totalRuns > 1
      ? `WIDE (+${totalRuns})! Slipped well down the leg side by ${bName}, beats the keeper for additional runs.`
      : `WIDE! Strayed down the leg side, signaled wide by the umpire (+1 run).`;
  }

  if (type === "No Ball") {
    return `NO BALL! Overstepping from ${bName}. Penalty awarded and a FREE HIT coming up! (+${totalRuns} runs)`;
  }

  if (type === "Bye") {
    return `BYE (+${totalRuns})! Delivery beats ${batName}'s bat and sneaks past the keeper for bye runs.`;
  }

  if (type === "Leg Bye") {
    return `LEG BYE (+${totalRuns})! Deflects off ${batName}'s pads into the gap as the batsmen steal the runs.`;
  }

  return `Extra: ${type} delivery (+${totalRuns} runs added).`;
}