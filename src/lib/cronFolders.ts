// Cron job folder definitions — each cron job gets a dedicated, visually distinct folder
export type CronFolder = {
  folder: string; // folder key used in DocumentItem.folder
  label: string;
  emoji: string;
  accent: string; // tailwind text color for the folder row
  bgAccent: string; // tailwind bg for the badge
};

export const CRON_FOLDERS: CronFolder[] = [
  {
    folder: "cron:daily-summary",
    label: "Daily Summary",
    emoji: "📝",
    accent: "text-emerald-400",
    bgAccent: "bg-emerald-500/20",
  },
  {
    folder: "cron:market-intel",
    label: "Market Intel Scanner",
    emoji: "📊",
    accent: "text-amber-400",
    bgAccent: "bg-amber-500/20",
  },
  {
    folder: "cron:x-engagement",
    label: "X Engagement — @StratifyAI",
    emoji: "🐦",
    accent: "text-sky-400",
    bgAccent: "bg-sky-500/20",
  },
];

export function getCronFolder(folderKey: string): CronFolder | undefined {
  return CRON_FOLDERS.find((c) => c.folder === folderKey);
}

export function isCronFolder(folderKey: string): boolean {
  return folderKey.startsWith("cron:");
}
