# Cube3DSymbol

상태에 따라 색상이 변경되는 3D 큐브 심볼 컴포넌트

## 특징

- 복잡한 linearGradient 사용으로 **상태별 전체 SVG 교체 방식** 적용
- Figma node-id: 1:102 (green), 1:178 (yellow), 1:140 (red)

## 상태

| 상태 | 설명 | 색상 |
|------|------|------|
| `green` | 정상 | 녹색 계열 (#4ADE80, #86EFAC, #D1FAE5) |
| `yellow` | 경고 | 노란색 계열 (#FACC15, #FEF08A, #FEF9C3) |
| `red` | 위험 | 빨간색 계열 (#EF4444, #FECACA, #FEE2E2) |

## API

### setStatus(status)

상태를 직접 변경합니다.

```javascript
setStatus('green');
setStatus('yellow');
setStatus('red');
```

### updateFromData(data)

데이터 객체로 상태를 변경합니다.

```javascript
updateFromData({ status: 'yellow' });
```

### getStatus()

현재 상태를 반환합니다.

```javascript
const current = getStatus(); // 'green' | 'yellow' | 'red'
```

## 데이터 구조

```javascript
{
    status: 'green' | 'yellow' | 'red'
}
```

## 구독 (Subscriptions)

| Topic | 함수 | 설명 |
|-------|------|------|
| `TBD_topicName` | `renderData` | 상태 데이터 수신 |

## 발행 이벤트 (Events)

| 이벤트 | 발생 시점 | payload |
|--------|----------|---------|
| `@TBD_symbolClicked` | 심볼 클릭 시 | `{ event, targetInstance }` |

## 파일 구조

```
Cube3DSymbol/
├── views/component.html      # 컨테이너 구조
├── styles/component.css      # 기본 스타일
├── scripts/
│   ├── register.js           # SVG 템플릿 + 상태 API
│   └── beforeDestroy.js      # 정리
├── preview.html              # 상태 전환 테스트
└── README.md                 # 이 문서
```

## 구현 방식

이 컴포넌트는 복잡한 linearGradient (10개)를 사용하여 CSS 변수만으로 색상을 제어하기 어렵습니다.
따라서 **상태별 전체 SVG 교체 방식**을 사용합니다.

```javascript
// register.js 내부
const svgTemplates = {
    green: '...green SVG...',
    yellow: '...yellow SVG...',
    red: '...red SVG...'
};

function setStatus(status) {
    symbolContainer.innerHTML = svgTemplates[status];
}
```

## 원본 Figma

- Figma 프로젝트: 심볼테스트
- 전체 프레임: node-id 1:198
- GREEN 큐브: node-id 1:102
- YELLOW 큐브: node-id 1:178
- RED 큐브: node-id 1:140
