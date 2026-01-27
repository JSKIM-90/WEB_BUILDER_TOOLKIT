# UPS 컴포넌트 Config 명세

## 개요

UPS 컴포넌트는 설정(Config)을 통해 API 응답과 UI를 매핑합니다. 이 문서는 각 Config의 역할과 사용법을 설명합니다.

---

## Config 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  UPS Component Config                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  datasetInfo          API 호출 ↔ 렌더링 함수 매핑               │
│  baseInfoConfig       헤더 영역 (asset 객체 → UI selector)      │
│  fieldsContainerSelector  동적 필드 컨테이너                    │
│  chartConfig          차트 렌더링 설정                          │
│  templateConfig       팝업 템플릿 ID                            │
│  popupCreatedConfig   팝업 생성 후 초기화 설정                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. datasetInfo

**역할**: API 호출과 렌더링 함수를 매핑

```javascript
this.datasetInfo = [
    { datasetName: 'assetDetailUnified', render: ['renderAssetInfo', 'renderProperties'] },
    // { datasetName: 'upsHistory', render: ['renderChart'] },  // 추후 활성화
];
```

| 필드 | 타입 | 설명 |
|------|------|------|
| datasetName | string | datasetList.json에 정의된 데이터셋 이름 |
| render | string[] | API 응답을 처리할 렌더링 함수명 배열 |

**데이터 흐름**:
```
fetchData(datasetName, params)
    │
    ├─→ API 응답 수신
    │
    └─→ render 배열의 각 함수 순차 호출
            ├─→ renderAssetInfo(response)  → 헤더 영역
            └─→ renderProperties(response) → 동적 필드 영역
```

---

## 2. baseInfoConfig

**역할**: API의 `asset` 객체 필드를 헤더 UI에 매핑

```javascript
this.baseInfoConfig = [
    { key: 'name', selector: '.ups-name' },
    { key: 'locationLabel', selector: '.ups-zone' },
    { key: 'statusType', selector: '.ups-status', transform: this.statusTypeToLabel },
    { key: 'statusType', selector: '.ups-status', dataAttr: 'status', transform: this.statusTypeToDataAttr },
];
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| key | string | O | API asset 객체의 필드명 |
| selector | string | O | 팝업 내 DOM selector |
| transform | function | X | 값 변환 함수 |
| dataAttr | string | X | data-* 속성명 (텍스트 대신 속성 설정) |

**매핑 예시**:

| API 필드 | UI selector | 결과 |
|----------|-------------|------|
| `asset.name = "UPS 0001"` | `.ups-name` | textContent = "UPS 0001" |
| `asset.locationLabel = "서버실 A"` | `.ups-zone` | textContent = "서버실 A" |
| `asset.statusType = "ACTIVE"` | `.ups-status` | textContent = "Normal" (transform) |
| `asset.statusType = "ACTIVE"` | `.ups-status[data-status]` | dataset.status = "normal" (transform + dataAttr) |

**왜 하드코딩인가?**

```
┌─────────────────────────────────────────────────────────────────┐
│  하드코딩의 원인: UI Selector (HTML 템플릿 종속)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  component.html (팝업 HTML 구조)                                │
│  ┌─────────────────────────────────────────────┐               │
│  │  <div class="ups-name">...</div>            │ ← 고정        │
│  │  <div class="ups-zone">...</div>            │ ← 고정        │
│  │  <div class="ups-status">...</div>          │ ← 고정        │
│  └─────────────────────────────────────────────┘               │
│                    ↑                                            │
│                    │                                            │
│  baseInfoConfig    │                                            │
│  ┌─────────────────┴───────────────────────────┐               │
│  │  selector: '.ups-name'   ←── HTML에 종속     │               │
│  │  selector: '.ups-zone'   ←── HTML에 종속     │               │
│  │  selector: '.ups-status' ←── HTML에 종속     │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| 항목 | 하드코딩 여부 | 이유 |
|------|--------------|------|
| `key` | O | API 표준 필드 (변경 빈도 낮음) |
| `selector` | **O (핵심)** | HTML 템플릿의 class명에 종속 |
| `transform` | O | 값 변환 로직은 컴포넌트별 고정 |

**핵심**: `selector`가 HTML 구조에 종속되어 있어 하드코딩이 불가피합니다.
HTML 템플릿의 class명이 바뀌면 이 config도 함께 수정해야 합니다.

---

## 3. fieldsContainerSelector

**역할**: 동적 프로퍼티가 렌더링될 컨테이너 지정

```javascript
this.fieldsContainerSelector = '.fields-container';
```

**API의 `properties` 배열**이 이 컨테이너에 동적으로 렌더링됩니다:

```javascript
// API 응답
properties: [
    { fieldKey: 'rated_power_kw', value: 75, label: '정격 전력', helpText: '...', displayOrder: 1 },
    { fieldKey: 'battery_capacity_ah', value: 150, label: '배터리 용량', helpText: '...', displayOrder: 2 },
    ...
]

// 렌더링 결과
<div class="fields-container">
    <div class="value-card" title="UPS 명판 기준 정격 전력 (kW)">
        <div class="value-label">정격 전력</div>
        <div class="value-data">75</div>
    </div>
    <div class="value-card" title="배터리 총 용량 (Ah)">
        <div class="value-label">배터리 용량</div>
        <div class="value-data">150</div>
    </div>
    ...
</div>
```

---

## 4. chartConfig

**역할**: ECharts 차트 렌더링 설정

```javascript
this.chartConfig = {
    xKey: 'timestamps',      // API 응답의 x축 데이터 키
    valuesKey: 'values',     // API 응답의 시계열 데이터 객체 키
    styleMap: {
        load: { color: '#3b82f6', smooth: true, areaStyle: true },
        battery: { color: '#22c55e', smooth: true },
    },
    optionBuilder: getMultiLineChartOption,
};
```

| 필드 | 타입 | 설명 |
|------|------|------|
| xKey | string | API 응답에서 x축 데이터 배열의 키 |
| valuesKey | string | API 응답에서 시계열 값 객체의 키 |
| styleMap | object | 각 series의 스타일 정의 (color, smooth, areaStyle) |
| optionBuilder | function | ECharts option 생성 함수 |

**API 응답 구조** (upsHistory):
```json
{
    "fields": [
        { "key": "load", "label": "부하율", "unit": "%" },
        { "key": "battery", "label": "배터리", "unit": "%" }
    ],
    "timestamps": ["10:00", "10:05", "10:10", ...],
    "values": {
        "load": [75, 78, 72, ...],
        "battery": [95, 94, 93, ...]
    }
}
```

---

## 5. templateConfig

**역할**: Shadow DOM 팝업 템플릿 ID 지정

```javascript
this.templateConfig = {
    popup: 'popup-ups',
};
```

`component.html`에서 해당 ID의 `<template>`을 찾아 팝업으로 사용:

```html
<template id="popup-ups">
    <div class="ups-popup">
        <!-- 팝업 내용 -->
    </div>
</template>
```

---

## 6. popupCreatedConfig

**역할**: 팝업 Shadow DOM 생성 후 초기화 설정

```javascript
this.popupCreatedConfig = {
    chartSelector: '.chart-container',
    events: {
        click: {
            '.close-btn': () => this.hideDetail(),
        },
    },
};
```

| 필드 | 타입 | 설명 |
|------|------|------|
| chartSelector | string | ECharts 인스턴스 생성 컨테이너 |
| events | object | 팝업 내 이벤트 바인딩 (이벤트타입 → {selector: handler}) |

---

## Config vs API 역할 분리

| 영역 | 데이터 소스 | Config 역할 |
|------|-------------|-------------|
| **헤더** | `asset` 객체 | `baseInfoConfig`로 UI 매핑 |
| **동적 필드** | `properties` 배열 | `fieldsContainerSelector`만 지정 |
| **차트** | `upsHistory` 응답 | `chartConfig`로 스타일/구조 정의 |

```
┌─────────────────────────────────────────────────────────────────┐
│  API 응답                     Config                   UI       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  asset.name ─────────────── baseInfoConfig ──────── .ups-name   │
│  asset.locationLabel ─────── baseInfoConfig ──────── .ups-zone  │
│  asset.statusType ────────── baseInfoConfig ──────── .ups-status│
│                                                                 │
│  properties[] ───────────── (동적 렌더링) ──────── .fields-container │
│                                                                 │
│  history data ──────────── chartConfig ──────────── .chart-container │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 변환 함수

### statusTypeToLabel

API statusType을 UI 라벨로 변환:

```javascript
function statusTypeToLabel(statusType) {
    const labels = {
        ACTIVE: 'Normal',
        WARNING: 'Warning',
        CRITICAL: 'Critical',
        INACTIVE: 'Inactive',
        MAINTENANCE: 'Maintenance',
    };
    return labels[statusType] || statusType;
}
```

### statusTypeToDataAttr

API statusType을 CSS data attribute 값으로 변환:

```javascript
function statusTypeToDataAttr(statusType) {
    const map = {
        ACTIVE: 'normal',
        WARNING: 'warning',
        CRITICAL: 'critical',
        INACTIVE: 'inactive',
        MAINTENANCE: 'maintenance',
    };
    return map[statusType] || 'normal';
}
```

---

## 참고

- [codeflow.md](./codeflow.md) - 코드 실행 흐름
- [API_SPEC.md](/RNBT_architecture/Projects/ECO/API_SPEC.md) - API 명세

---

*최종 업데이트: 2026-01-27*
