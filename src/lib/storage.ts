import { emptyProgress, type Progress } from './study';

const KEY = 'engvoca3000:v1';

export function load(): Progress {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return emptyProgress(); // 저장소 접근 차단(사생활 보호 모드 등)
  }
  if (!raw) return fresh(emptyProgress());

  try {
    const p = JSON.parse(raw);
    if (p?.version === 1) {
      // seed가 없던 이전 기록은 이 시점에 브라우저 전용 순서를 새로 정한다
      return typeof p.seed === 'number' ? { ...emptyProgress(p.seed), ...p } : fresh({ ...emptyProgress(), ...p });
    }
  } catch {
    // 아래에서 원본 보존
  }
  // 깨진 기록을 조용히 덮어쓰지 않도록 원본을 옮겨 둔다
  try {
    localStorage.setItem(`${KEY}:broken`, raw);
  } catch {
    // 보존 실패해도 앱은 계속 동작
  }
  console.error('학습 기록을 읽지 못해 새로 시작합니다. 원본:', `${KEY}:broken`);
  return fresh(emptyProgress());
}

// 새로 만든 seed는 바로 저장해 두어야 다시 읽어도 같은 순서가 나온다
function fresh(p: Progress) {
  save(p);
  return p;
}

export function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch (e) {
    console.error('학습 기록 저장 실패', e);
  }
}
