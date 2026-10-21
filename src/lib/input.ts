import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

// 키 이름 → 동작. 'Space', 'ArrowLeft' 같은 이름이나 소문자 한 글자('p', '1')를 쓴다.
export function useKeys(map: Record<string, (() => void) | undefined>) {
  const latest = useRef(map);
  latest.current = map;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const action = latest.current[key];
      if (!action) return;
      e.preventDefault(); // Space가 포커스된 버튼을 누르거나 페이지를 스크롤하지 않게
      action();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
}

const EDGE = 24; // OS 뒤로가기 제스처 영역
const MIN_DISTANCE = 50;

// 터치 가로 스와이프. 요소에 touch-action: pan-y가 있어야 세로 스크롤과 공존한다.
export function useSwipe(onLeft?: () => void, onRight?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.clientX < EDGE || e.clientX > innerWidth - EDGE) return;
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy)) return;
      const action = dx < 0 ? onLeft : onRight;
      if (!action) return;
      swiped.current = true;
      setTimeout(() => (swiped.current = false), 400); // click이 안 따라오는 기기 대비
      action();
    },
    onPointerCancel: () => {
      start.current = null;
    },
    // 스와이프 끝에 따라오는 click이 예문 번역을 토글하지 않게 막는다
    onClickCapture: (e: MouseEvent) => {
      if (!swiped.current) return;
      swiped.current = false;
      e.stopPropagation();
      e.preventDefault();
    },
  };
}
