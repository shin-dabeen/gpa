// ===== 산업경영공학과 학점 위젯 (Scriptable) =====
// 홈 화면 위젯: 전체 평점 + 130학점 기준 진행률
const DATA_URL = "https://shin-dabeen.github.io/gpa/data.json";
const APP_URL  = "https://shin-dabeen.github.io/gpa/";
const TOTAL = 130;
const GRADES = {"A+":4.5,"A0":4,"B+":3.5,"B0":3,"C+":2.5,"C0":2,"D+":1.5,"D0":1,"F":0,"P":null,"NP":null};

// 데이터 불러오기 (실패 시 마지막 캐시 사용)
const fm = FileManager.local();
const cachePath = fm.joinPath(fm.cacheDirectory(), "gpa-widget-cache.json");
let db = [];
try {
  const req = new Request(DATA_URL + "?t=" + Date.now());
  const d = await req.loadJSON();
  db = Array.isArray(d) ? d : (d.db || []);
  fm.writeString(cachePath, JSON.stringify(db));
} catch (e) {
  if (fm.fileExists(cachePath)) db = JSON.parse(fm.readString(cachePath));
}

// 계산 (앱과 동일 로직)
const earned = db.filter(c => c.grade !== "F" && c.grade !== "NP").reduce((s, c) => s + c.cr, 0);
let pts = 0, crs = 0;
for (const c of db) {
  const g = GRADES[c.grade];
  if (g !== null && g !== undefined) { pts += g * c.cr; crs += c.cr; }
}
const gpa = crs ? pts / crs : 0;
const pct = Math.min(1, earned / TOTAL);

// 색상 (라이트/다크 대응)
const BG   = Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e"));
const TXT  = Color.dynamic(new Color("#1c2333"), new Color("#ffffff"));
const SUB  = Color.dynamic(new Color("#6b7590"), new Color("#9aa2b5"));
const BLUE = new Color("#2563eb");
const TRACK = new Color("#7f8aa3", 0.25);

// 위젯 구성
const w = new ListWidget();
w.backgroundColor = BG;
w.url = APP_URL; // 탭하면 앱 열림
w.setPadding(14, 14, 14, 14);
w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 60 * 6); // 6시간마다 갱신

const t1 = w.addText("📊 학점 현황");
t1.font = Font.mediumSystemFont(11);
t1.textColor = SUB;
w.addSpacer(6);

const g1 = w.addText(crs ? gpa.toFixed(2) : "-");
g1.font = Font.boldSystemFont(30);
g1.textColor = TXT;
const g2 = w.addText("전체 평점 / 4.5");
g2.font = Font.systemFont(10);
g2.textColor = SUB;

w.addSpacer();

// 진행률 바
function barImg(p, width, height) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const bg = new Path();
  bg.addRoundedRect(new Rect(0, 0, width, height), height / 2, height / 2);
  ctx.addPath(bg); ctx.setFillColor(TRACK); ctx.fillPath();
  const fg = new Path();
  fg.addRoundedRect(new Rect(0, 0, Math.max(height, width * p), height), height / 2, height / 2);
  ctx.addPath(fg); ctx.setFillColor(BLUE); ctx.fillPath();
  return ctx.getImage();
}
const barW = (config.widgetFamily === "medium" || config.widgetFamily === "large") ? 280 : 120;
const img = w.addImage(barImg(pct, barW, 8));
img.imageSize = new Size(barW, 8);
w.addSpacer(6);

const t2 = w.addText(`${earned} / ${TOTAL}학점 · ${(pct * 100).toFixed(1)}%`);
t2.font = Font.mediumSystemFont(11);
t2.textColor = SUB;

if (!config.runsInWidget) await w.presentSmall();
Script.setWidget(w);
Script.complete();
