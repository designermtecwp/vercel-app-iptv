export interface AppSettings {
  quality: string;
  autoplay: boolean;
  sortOrder: string;
  parentalEnabled: boolean;
  parentalPin: string;
  adultLocked: boolean;
  hiddenCats: {id:string;name:string}[];
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaults();
  return {
    quality: localStorage.getItem("iptv_quality") || "auto",
    autoplay: localStorage.getItem("iptv_autoplay") !== "false",
    sortOrder: localStorage.getItem("iptv_sort") || "default",
    parentalEnabled: localStorage.getItem("iptv_parental") === "true",
    parentalPin: localStorage.getItem("iptv_pin") || "0000",
    adultLocked: localStorage.getItem("iptv_adult_locked") !== "false",
    hiddenCats: JSON.parse(localStorage.getItem("iptv_hidden_cats") || "[]"),
  };
}

function defaults(): AppSettings {
  return { quality:"auto", autoplay:true, sortOrder:"default", parentalEnabled:false, parentalPin:"0000", adultLocked:true, hiddenCats:[] };
}

const ADULT_KEYWORDS = ["adult","adulto","adultos","xxx","18+","erotic","erotico","porn","sex","hot","blue"];

export function isAdultCategory(name: string): boolean {
  const n = name.toLowerCase();
  return ADULT_KEYWORDS.some(k => n.includes(k));
}

export function sortItems<T extends {name:string}>(items: T[], order: string): T[] {
  const copy = [...items];
  if (order === "az") return copy.sort((a,b)=>a.name.localeCompare(b.name));
  if (order === "za") return copy.sort((a,b)=>b.name.localeCompare(a.name));
  return copy;
}
