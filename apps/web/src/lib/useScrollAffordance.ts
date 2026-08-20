import { useEffect, useState, type RefObject } from "react";

export interface ScrollAffordance {
  canScrollUp: boolean;
  canScrollDown: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

const NONE: ScrollAffordance = {
  canScrollUp: false,
  canScrollDown: false,
  canScrollLeft: false,
  canScrollRight: false,
};

/** 서브픽셀 오차로 "1px 남았다"고 잘못 판정하는 걸 막는 여유값. */
const EPSILON = 1;

/**
 * 컨테이너가 각 방향으로 더 스크롤될 수 있는지 판정한다.
 * scroll 이벤트와 ResizeObserver 양쪽을 구독해 콘텐츠·뷰포트 변화에 모두 반응한다.
 */
export function useScrollAffordance(ref: RefObject<HTMLElement>): ScrollAffordance {
  const [state, setState] = useState<ScrollAffordance>(NONE);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth, scrollTop, clientHeight, scrollHeight } = el;
      setState({
        canScrollLeft: scrollLeft > EPSILON,
        canScrollRight: scrollLeft + clientWidth < scrollWidth - EPSILON,
        canScrollUp: scrollTop > EPSILON,
        canScrollDown: scrollTop + clientHeight < scrollHeight - EPSILON,
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref]);

  return state;
}
