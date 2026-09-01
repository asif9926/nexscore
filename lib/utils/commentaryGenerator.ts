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

// 🎯 রান ও বাউন্ডারি ধারাভাষ্য
export function generateRunCommentary({
  bowlerName,
  batsmanName,
  runs,
}: RunCommentaryParams): string {
  if (runs === 0) {
    const dotPhrases = [
      `${bowlerName} to ${batsmanName}, dot ball, defended solid into the off side.`,
      `${bowlerName} keeps it tight to ${batsmanName}, no run taken.`,
      `${bowlerName} bowls a good length delivery, ${batsmanName} lets it go to the keeper.`,
      `${bowlerName} to ${batsmanName}, beaten for pace! No run.`,
    ];
    return dotPhrases[Math.floor(Math.random() * dotPhrases.length)];
  }

  if (runs === 4) {
    const fourPhrases = [
      `FOUR! ${batsmanName} drives ${bowlerName} beautifully through the covers for a boundary!`,
      `FOUR! Smashed with authority by ${batsmanName} off ${bowlerName}'s delivery.`,
      `FOUR! Edged but finds the gap! Races away to the third man fence.`,
      `FOUR! Pure timing from ${batsmanName}! Beats mid-off comfortably.`,
    ];
    return fourPhrases[Math.floor(Math.random() * fourPhrases.length)];
  }

  if (runs === 6) {
    const sixPhrases = [
      `SIX! ${batsmanName} launches ${bowlerName} high into the night sky! Massive hit!`,
      `SIX! Dispatched into the stands! What a sensational shot from ${batsmanName}.`,
      `SIX! Clean strike over long-on! That has gone miles into the crowd.`,
      `SIX! Picked up effortlessly over deep mid-wicket by ${batsmanName}.`,
    ];
    return sixPhrases[Math.floor(Math.random() * sixPhrases.length)];
  }

  if (runs === 1) {
    return `${bowlerName} to ${batsmanName}, pushed into the gap for a single.`;
  }

  if (runs === 2) {
    return `${bowlerName} to ${batsmanName}, worked into deep space, quick running gets them a couple.`;
  }

  if (runs === 3) {
    return `${bowlerName} to ${batsmanName}, excellent running between the wickets, 3 runs completed!`;
  }

  return `${bowlerName} to ${batsmanName}, ${runs} runs taken.`;
}

// 🎯 উইকেট ধারাভাষ্য
export function generateWicketCommentary({
  bowlerName,
  batsmanName,
  dismissalType,
  runsCompleted = 0,
}: WicketCommentaryParams): string {
  switch (dismissalType) {
    case "Bowled":
      return `OUT! Bowled him! ${bowlerName} knocks back the stumps! ${batsmanName} has to walk back.`;
    case "Caught":
      return `OUT! In the air and taken! A crucial breakthrough as ${batsmanName} departs c & b ${bowlerName}.`;
    case "LBW":
      return `OUT! Loud appeal and given LBW! Plumb in front off ${bowlerName}'s delivery.`;
    case "Run Out":
      return `OUT! RUN OUT! Direct hit at the striker's end! ${batsmanName} falls short (${runsCompleted} runs completed).`;
    case "Stumped":
      return `OUT! Stumped! ${batsmanName} steps down the track, misses, and the bails are off in a flash!`;
    case "Hit Wicket":
      return `OUT! Unfortunate! ${batsmanName} accidentally clips his own stumps!`;
    default:
      return `OUT! ${dismissalType} (${batsmanName}) off the bowling of ${bowlerName}.`;
  }
}

// 🎯 এক্সট্রা (Wide, No Ball, Byes) ধারাভাষ্য
export function generateExtraCommentary({
  bowlerName,
  batsmanName,
  type,
  totalRuns,
}: ExtraCommentaryParams): string {
  if (type === "Wide") {
    return `Extra: Wide ball bowled down the leg side by ${bowlerName}. (+${totalRuns} runs added)`;
  }
  if (type === "No Ball") {
    return `Extra: No Ball called against ${bowlerName}! Free hit upcoming (+${totalRuns} runs).`;
  }
  if (type === "Bye") {
    return `Extra: ${totalRuns} Bye runs taken as the ball beats both ${batsmanName} and the wicketkeeper.`;
  }
  if (type === "Leg Bye") {
    return `Extra: ${totalRuns} Leg Bye runs as the ball deflects off ${batsmanName}'s pads.`;
  }
  return `Extra: ${type} delivery (+${totalRuns} runs).`;
}