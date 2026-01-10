# Component Structure Guide

컴포넌트 자산을 쌓기 위한 구조 가이드입니다.

---

## 핵심 원칙

**Figma 선택 요소 = 컨테이너**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Figma 링크 제공 = 컴포넌트 단위 선택                                  │
│                                                                      │
│  사용자가 Figma 링크를 제공하면:                                       │
│  - 선택된 요소의 가장 바깥 = div 컨테이너                              │
│  - 선택된 요소의 크기 = 컨테이너 크기                                  │
│  - 내부 요소 = innerHTML (Figma 스타일 그대로)                        │
└─────────────────────────────────────────────────────────────────────┘
```

```html
<div id="[component-name]-container">  <!-- 컴포넌트별 고유 ID -->
    <div class="transaction-table">    <!-- Figma 내부 요소 (스타일 그대로) -->
        ...
    </div>
</div>
```

> **컨테이너 ID 규칙**: `#[component-name]-container` 형식으로 고유 ID 부여
> 예: `#transaction-table-container`, `#stats-cards-container`

---

## 웹 빌더 기본 구조

웹 빌더는 컴포넌트마다 **div 컨테이너**를 기본 단위로 가집니다.

```
웹 빌더에서 컴포넌트를 배치하면:

<div id="component-xxx">   ← 웹 빌더가 자동 생성하는 컨테이너
    <!-- innerHTML -->     ← 사용자 정의 내용
</div>
```

따라서 Figma 선택 요소의 크기가 곧 컨테이너 크기가 되어야 스타일링이 그대로 유지됩니다.

---

## 컨테이너 크기 규칙

```
┌─────────────────────────────────────────────────────────────────────┐
│  컨테이너 크기 = Figma 선택 요소 크기 (고정)                           │
│                                                                      │
│  Figma에서 524 × 350 요소 선택                                        │
│       ↓                                                              │
│  #[component-name]-container {                                       │
│      width: 524px;                                                   │
│      height: 350px;                                                  │
│      overflow: auto;  /* 동적 렌더링 대응 - 유일한 추가 */              │
│  }                                                                   │
│                                                                      │
│  * 내부 HTML/CSS는 Figma 스타일 그대로 구현                            │
│  * overflow: auto는 동적 렌더링 시 콘텐츠 넘침 대응                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 설계 철학

### Figma 스타일 그대로 유지

- 컨테이너 크기 = Figma 선택 요소 크기
- 내부 요소 스타일 = Figma에서 추출한 그대로
- **임의로 width: 100%, height: 100%로 변경하지 않음**

### 박스 단위 조합

컨테이너가 있으면 조합이 단순해집니다:

```html
<!-- 컨테이너 없이 -->
<button>Click</button>
<!-- 조합 시 버튼 자체 스타일이 레이아웃에 간섭 -->

<!-- 컨테이너 있음 -->
<div class="button-container">
    <button>Click</button>
</div>
<!-- 박스끼리 조합 → 내부는 신경 안 써도 됨 -->
```

- 외부에서 보면: 그냥 박스
- 내부에서 보면: 버튼이든 테이블이든 상관없음
- 조합하는 쪽에서 내부 구현을 알 필요 없음

---

## 파일 구성

하나의 컴포넌트는 다음 파일들로 구성됩니다:

| 파일 | 역할 |
|------|------|
| `ComponentName.html` | 내부 요소 HTML |
| `ComponentName.css` | 내부 요소 스타일 (Figma 그대로) |

Figma_Conversion에서는 스크립트 작업 없이 순수 HTML/CSS만 추출합니다.

---

## 컴포넌트 템플릿

### HTML

```html
<div id="[component-name]-container">
    <div class="component-name">
        <!-- Figma 내부 구조 그대로 -->
    </div>
</div>
```

예시:
```html
<div id="transaction-table-container">
    <div class="transaction-table">
        <!-- Figma 내부 구조 그대로 -->
    </div>
</div>
```

### CSS

```css
/* 컨테이너: Figma 선택 요소 크기 */
#transaction-table-container {
    width: 524px;   /* Figma 크기 */
    height: 350px;  /* Figma 크기 */
    overflow: auto; /* 동적 렌더링 대응 */
}

/* 내부 요소: Figma 스타일 그대로 (CSS Nesting) */
#transaction-table-container {
    .transaction-table {
        /* Figma에서 추출한 스타일 그대로 적용 */
        display: flex;
        flex-direction: column;
        padding: 14px 24px 20px 24px;
        /* ... */
    }
}
```

---

## 트레이드오프

### 장점

- **디자인 일관성**: Figma 스타일을 그대로 유지
- **독립성**: 각 컴포넌트가 자신의 경계 안에서 완결됨
- **조합성**: 컨테이너 크기만 조정하면 어떤 레이아웃에도 배치 가능
- **예측 가능성**: 일관된 구조로 유지보수 용이

### 단점

- **DOM 깊이 증가**: 모든 컴포넌트마다 컨테이너 div 추가
- **단순 컴포넌트 오버헤드**: 아이콘 하나도 컨테이너 필요

### 결론

비주얼 빌더에서는 **Figma 스타일 유지**와 **예측 가능한 구조**의 가치가 트레이드오프보다 큽니다.

---

**버전**: 2.2.0
**작성일**: 2026-01-07
**변경사항**:
- v2.2.0: 컨테이너 ID 명명 규칙 명확화 (`#[component-name]-container`)
- v2.1.0: CONTAINER_STYLES.md 섹션 제거 - Figma 크기 = 컨테이너 크기로 단순화
- v2.0.0: Figma 스타일 그대로 유지 원칙 명확화, height: 100% 패턴 제거
