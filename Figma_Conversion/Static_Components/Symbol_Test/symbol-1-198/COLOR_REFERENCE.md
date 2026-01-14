# 3D Cube Symbol - 상태별 색상 정보

Figma에서 추출한 상태별 색상 참조 문서입니다.

## 상태별 Figma Node ID

| 상태 | Node ID | SVG 파일 |
|------|---------|----------|
| GREEN | 1:102 | b8793918a312d95b5e286a38e35d3b5fd1e7e5d9.svg |
| YELLOW | 1:178 | 8a84d9180779179607f94b5c95de9d585f40b6e7.svg |
| RED | 1:140 | 9cb88c73a077b8d927bf810b2ab40b24d29a30e2.svg |

## CSS 변수 색상 (var(--fill-0), var(--stroke-0))

SVG 내부에서 CSS 변수로 정의된 색상들입니다.

### GREEN 상태
```css
--fill-0: #4ADE80;   /* 기본 fill */
--fill-0: #86EFAC;   /* 밝은 fill (하이라이트) */
--fill-0: #D1FAE5;   /* 가장 밝은 fill (상단면) */
--stroke-0: #16A34A; /* stroke */
```

### YELLOW 상태
```css
--fill-0: #FACC15;   /* 기본 fill */
--fill-0: #FEF08A;   /* 밝은 fill (하이라이트) */
--fill-0: #FEF9C3;   /* 가장 밝은 fill (상단면) */
--stroke-0: #CA8A04; /* stroke */
```

### RED 상태
```css
--fill-0: #EF4444;   /* 기본 fill */
--fill-0: #FECACA;   /* 밝은 fill (하이라이트) */
--fill-0: #FEE2E2;   /* 가장 밝은 fill (상단면) */
--stroke-0: #DC2626; /* stroke */
```

## LinearGradient 색상 (defs 내부)

각 상태별 그라디언트에 사용된 주요 색상입니다.

### GREEN 상태 Gradient 색상
| Gradient | 용도 | 색상 |
|----------|------|------|
| paint0 | 바닥면 그림자 | #3A6B47 → #2D5A3A |
| paint1 | 측면 | #5DBF6C → #3A6B47 |
| paint2 | 전면 | #166534 → #4ADE80 → #15803D |
| paint3 | 반사 | #86EFAC(0.3) → #2D5A3A(0.23) |
| paint4 | 테두리 | #166534 → #86EFAC → #15803D |
| paint5 | 내부 테두리 | #4ADE80 → #86EFAC → #22C55E |
| paint6 | 상단면 | #86EFAC → #4ADE80 |
| paint7 | 하이라이트 | #2D7A3E → #4ADE80 → #1E6B2E |
| paint8 | 전면 밝은 | #4ADE80 → #D1FAE5 → #1E6B2E |
| paint9 | 반사 밝은 | #D1FAE5(0.4) → #1E6B2E(0.3) |

### YELLOW 상태 Gradient 색상
| Gradient | 용도 | 색상 |
|----------|------|------|
| paint0 | 바닥면 그림자 | #8B6F20 → #6B5617 |
| paint1 | 측면 | #C9A637 → #8B6F20 |
| paint2 | 전면 | #713F12 → #FDE047 → #A16207 |
| paint3 | 반사 | #FEF08A(0.3) → #6B5617(0.23) |
| paint4 | 테두리 | #713F12 → #FEF08A → #A16207 |
| paint5 | 내부 테두리 | #FDE047 → #FEF08A → #FACC15 |
| paint6 | 상단면 | #FEF08A → #FDE047 |
| paint7 | 하이라이트 | #A16207 → #FDE047 → #854D0E |
| paint8 | 전면 밝은 | #FDE047 → #FEF9C3 → #854D0E |
| paint9 | 반사 밝은 | #FEF9C3(0.4) → #854D0E(0.3) |

### RED 상태 Gradient 색상
| Gradient | 용도 | 색상 |
|----------|------|------|
| paint0 | 바닥면 그림자 | #8B3A3A → #6B2D2D |
| paint1 | 측면 | #B55F5F → #8B3A3A |
| paint2 | 전면 | #7F1D1D → #FCA5A5 → #991B1B |
| paint3 | 반사 | #FECACA(0.3) → #6B2D2D(0.23) |
| paint4 | 테두리 | #7F1D1D → #FECACA → #991B1B |
| paint5 | 내부 테두리 | #FCA5A5 → #FECACA → #EF4444 |
| paint6 | 상단면 | #FECACA → #FCA5A5 |
| paint7 | 하이라이트 | #991B1B → #FCA5A5 → #7F1D1D |
| paint8 | 전면 밝은 | #FCA5A5 → #FEE2E2 → #7F1D1D |
| paint9 | 반사 밝은 | #FEE2E2(0.4) → #7F1D1D(0.3) |

## 구현 방식 권장사항

이 SVG는 복잡한 linearGradient를 사용하므로, **상태별 전체 SVG 교체 방식**을 권장합니다.

```javascript
// 상태별 SVG 템플릿 저장
const svgTemplates = {
  green: '...green SVG content...',
  yellow: '...yellow SVG content...',
  red: '...red SVG content...'
};

// 상태 변경 시 innerHTML 교체
function setStatus(status) {
  container.innerHTML = svgTemplates[status];
}
```

## 파일 구조

```
symbol-1-198/
├── assets/
│   ├── b879...svg  (GREEN)
│   ├── 8a84...svg  (YELLOW)
│   └── 9cb8...svg  (RED)
├── screenshots/
│   └── impl.png
├── 3d-cube-symbol.html
├── 3d-cube-symbol.css
└── COLOR_REFERENCE.md (이 문서)
```
