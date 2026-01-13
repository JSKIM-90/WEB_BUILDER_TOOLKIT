/*
 * Page - loaded
 * ECO (Energy & Cooling Operations) Dashboard
 *
 * Responsibilities:
 * - 데이터셋 정의 (globalDataMappings)
 * - Param 관리 (currentParams)
 * - GlobalDataPublisher로 데이터 발행
 * - 구독자(컴포넌트)에게 데이터 전파
 */

const { each } = fx;

// ======================
// DATA MAPPINGS
// ======================

this.globalDataMappings = [
    {
        topic: 'hierarchy',
        datasetInfo: {
            datasetName: 'hierarchy',
            param: {}
        },
        refreshInterval: null  // 수동 갱신만
    },
    {
        topic: 'hierarchyAssets',
        datasetInfo: {
            datasetName: 'hierarchyAssets',
            param: { nodeId: '' }
        },
        refreshInterval: null
    },
    {
        topic: 'assets',
        datasetInfo: {
            datasetName: 'assets',
            param: {}
        },
        refreshInterval: null  // 수동 갱신만 (refresh 버튼)
    }
];

// ======================
// PARAM MANAGEMENT
// ======================

this.currentParams = {};

// 매핑 등록 + 초기 파라미터 설정
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic, datasetInfo }) => {
        this.currentParams[topic] = { ...datasetInfo.param };
    })
);

// 초기 데이터 발행 (hierarchy만 - 트리 렌더링용)
GlobalDataPublisher.fetchAndPublish('hierarchy', this, this.currentParams['hierarchy'])
    .catch(err => console.error('[fetchAndPublish:hierarchy]', err));

// ======================
// INTERVAL MANAGEMENT (필요 시 활성화)
// ======================

this.startAllIntervals = () => {
    this.refreshIntervals = {};

    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.refreshIntervals[topic] = setInterval(() => {
                    GlobalDataPublisher.fetchAndPublish(
                        topic,
                        this,
                        this.currentParams[topic] || {}
                    ).catch(err => console.error(`[fetchAndPublish:${topic}]`, err));
                }, refreshInterval);
            }
        })
    );
};

this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );
};

// 현재는 수동 갱신만 사용하므로 interval 시작하지 않음
// this.startAllIntervals();

console.log('[Page] loaded - ECO Dashboard data mappings registered, hierarchy data published');
