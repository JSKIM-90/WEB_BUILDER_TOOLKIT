const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());

// ======================
// UTILITY FUNCTIONS
// ======================

function getRandomStatus() {
    const rand = Math.random();
    if (rand < 0.75) return 'normal';
    if (rand < 0.92) return 'warning';
    return 'critical';
}

function calculateAggregateStatus(items) {
    if (!items || items.length === 0) return 'normal';
    if (items.some(i => i.status === 'critical')) return 'critical';
    if (items.some(i => i.status === 'warning')) return 'warning';
    return 'normal';
}

// ======================
// HIERARCHY DATA STRUCTURE
// ======================

const BUILDINGS = [
    { id: 'building-001', name: '본관' },
    { id: 'building-002', name: '별관 A' },
    { id: 'building-003', name: '별관 B' }
];

const ROOM_NAMES = [
    '서버실 A', '서버실 B', '네트워크실', '전산실',
    '통신실', 'UPS실', '항온항습실', '모니터링실',
    '백업실', '스토리지실', '개발실', '운영실'
];

// Hierarchy & Assets Cache
let HIERARCHY_CACHE = null;
let ASSETS_BY_ROOM = {};
let ALL_ASSETS = [];

// ======================
// HIERARCHY DATA GENERATORS
// ======================

function generateHierarchy() {
    const items = [];
    let assetIndex = 0;
    let roomIndex = 0;

    BUILDINGS.forEach((building, bIdx) => {
        const floors = [];

        // 건물당 2개 층
        for (let fIdx = 0; fIdx < 2; fIdx++) {
            const floorNum = String(fIdx + 1).padStart(2, '0');
            const floorId = `floor-${building.id.split('-')[1]}-${floorNum}`;
            const rooms = [];

            // 층당 2개 방
            for (let rIdx = 0; rIdx < 2; rIdx++) {
                const roomNum = String(rIdx + 1).padStart(2, '0');
                const roomId = `room-${building.id.split('-')[1]}-${floorNum}-${roomNum}`;
                const roomAssets = generateRoomAssets(roomId, assetIndex);
                assetIndex += 6;

                const roomStatus = calculateAggregateStatus(roomAssets);

                // 방별 자산 저장
                ASSETS_BY_ROOM[roomId] = roomAssets;
                ALL_ASSETS = ALL_ASSETS.concat(roomAssets);

                rooms.push({
                    id: roomId,
                    name: ROOM_NAMES[roomIndex % ROOM_NAMES.length],
                    type: 'room',
                    status: roomStatus,
                    assetCount: roomAssets.length
                });

                roomIndex++;
            }

            const floorStatus = calculateAggregateStatus(rooms);

            floors.push({
                id: floorId,
                name: `${fIdx + 1}층`,
                type: 'floor',
                status: floorStatus,
                children: rooms
            });
        }

        const buildingStatus = calculateAggregateStatus(floors);

        items.push({
            id: building.id,
            name: building.name,
            type: 'building',
            status: buildingStatus,
            children: floors
        });
    });

    return items;
}

function generateRoomAssets(roomId, startIndex) {
    const assets = [];

    // 방당 6개 자산: UPS 1, PDU 2, CRAC 1, Sensor 2
    const assetConfig = [
        { type: 'ups', prefix: 'UPS' },
        { type: 'pdu', prefix: 'PDU' },
        { type: 'pdu', prefix: 'PDU' },
        { type: 'crac', prefix: 'CRAC' },
        { type: 'sensor', prefix: 'Sensor' },
        { type: 'sensor', prefix: 'Sensor' }
    ];

    assetConfig.forEach((config, i) => {
        const idx = startIndex + i + 1;
        const status = getRandomStatus();
        assets.push({
            id: `${config.type}-${String(idx).padStart(3, '0')}`,
            type: config.type,
            name: `${config.prefix} ${String(idx).padStart(3, '0')}`,
            roomId,
            status
        });
    });

    return assets;
}

function initializeHierarchy() {
    ASSETS_BY_ROOM = {};
    ALL_ASSETS = [];

    const items = generateHierarchy();

    HIERARCHY_CACHE = {
        title: 'ECO 자산 관리',
        items,
        summary: {
            buildings: 3,
            floors: 6,
            rooms: 12,
            assets: ALL_ASSETS.length
        }
    };

    console.log(`[Hierarchy] Initialized: ${HIERARCHY_CACHE.summary.buildings} buildings, ${HIERARCHY_CACHE.summary.floors} floors, ${HIERARCHY_CACHE.summary.rooms} rooms, ${HIERARCHY_CACHE.summary.assets} assets`);
}

function findNodeById(nodeId) {
    if (!HIERARCHY_CACHE) return null;

    for (const building of HIERARCHY_CACHE.items) {
        if (building.id === nodeId) return building;
        for (const floor of building.children || []) {
            if (floor.id === nodeId) return floor;
            for (const room of floor.children || []) {
                if (room.id === nodeId) return room;
            }
        }
    }
    return null;
}

function getNodePath(nodeId) {
    if (!HIERARCHY_CACHE) return '';

    for (const building of HIERARCHY_CACHE.items) {
        if (building.id === nodeId) return building.name;
        for (const floor of building.children || []) {
            if (floor.id === nodeId) return `${building.name} > ${floor.name}`;
            for (const room of floor.children || []) {
                if (room.id === nodeId) return `${building.name} > ${floor.name} > ${room.name}`;
            }
        }
    }
    return '';
}

// ======================
// UPS MOCK DATA GENERATORS
// ======================

function generateUPS(id) {
    const load = Math.round((30 + Math.random() * 50 + (Math.random() > 0.9 ? 30 : 0)) * 10) / 10;
    const batteryLevel = Math.round((80 + Math.random() * 20) * 10) / 10;
    const batteryHealth = Math.round((85 + Math.random() * 15) * 10) / 10;

    let status = 'normal';
    if (load >= 90 || batteryLevel <= 15) status = 'critical';
    else if (load >= 70 || batteryLevel <= 30) status = 'warning';

    const modes = ['online', 'online', 'online', 'bypass', 'battery'];

    // Find roomId from ALL_ASSETS
    const asset = ALL_ASSETS.find(a => a.id === id);

    return {
        id,
        name: `UPS ${id.split('-')[1]}`,
        roomId: asset?.roomId || null,
        inputVoltage: Math.round((218 + Math.random() * 4) * 10) / 10,
        outputVoltage: Math.round((219 + Math.random() * 2) * 10) / 10,
        load,
        batteryLevel,
        batteryHealth,
        runtime: Math.floor(batteryLevel * 0.6),
        temperature: Math.round((28 + Math.random() * 10) * 10) / 10,
        status,
        mode: modes[Math.floor(Math.random() * modes.length)],
        threshold: {
            loadWarning: 70,
            loadCritical: 90,
            batteryWarning: 30,
            batteryCritical: 15
        },
        lastUpdated: new Date().toISOString()
    };
}

function generateUPSHistory(upsId, period = '24h') {
    const now = new Date();
    const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = 60;

    const timestamps = [];
    const loadData = [];
    const batteryData = [];

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * interval * 60000);
        timestamps.push(time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

        const baseLoad = 50 + Math.sin(i / 4) * 15;
        const noiseLoad = (Math.random() - 0.5) * 10;
        loadData.push(Math.round(Math.max(20, Math.min(95, baseLoad + noiseLoad)) * 10) / 10);

        const baseBattery = 95 + Math.sin(i / 12) * 5;
        const noiseBattery = (Math.random() - 0.5) * 3;
        batteryData.push(Math.round(Math.max(60, Math.min(100, baseBattery + noiseBattery)) * 10) / 10);
    }

    return {
        upsId,
        period,
        timestamps,
        load: loadData,
        battery: batteryData,
        thresholds: {
            loadWarning: 70,
            loadCritical: 90
        }
    };
}

// ======================
// PDU MOCK DATA GENERATORS
// ======================

function generatePDU(id) {
    const totalPower = Math.round((8 + Math.random() * 10) * 10) / 10;
    const voltage = 220;
    const totalCurrent = Math.round((totalPower * 1000 / voltage) * 10) / 10;
    const circuitCount = 24;
    const activeCircuits = 12 + Math.floor(Math.random() * 10);

    let status = 'normal';
    if (totalPower >= 18) status = 'critical';
    else if (totalPower >= 15) status = 'warning';

    const asset = ALL_ASSETS.find(a => a.id === id);

    return {
        id,
        name: `PDU ${id.split('-')[1]}`,
        roomId: asset?.roomId || null,
        totalPower,
        totalCurrent,
        voltage,
        circuitCount,
        activeCircuits,
        powerFactor: Math.round((0.9 + Math.random() * 0.1) * 100) / 100,
        status,
        threshold: {
            powerWarning: 15,
            powerCritical: 18
        },
        lastUpdated: new Date().toISOString()
    };
}

function generatePDUCircuits(pduId) {
    const circuitNames = [
        'Server Rack A', 'Server Rack B', 'Network Switch', 'Storage Array',
        'Cooling Unit', 'Lighting', 'Monitoring', 'UPS Feed', 'HVAC',
        'Security System', 'Fire Suppression', 'Backup Power'
    ];

    const count = 18 + Math.floor(Math.random() * 6);
    const circuits = [];

    for (let i = 0; i < count; i++) {
        const current = Math.round(Math.random() * 15 * 10) / 10;
        const power = Math.round((current * 220 / 1000) * 100) / 100;
        const isActive = current > 0.5;

        circuits.push({
            id: i + 1,
            name: `${circuitNames[i % circuitNames.length]} ${Math.floor(i / circuitNames.length) + 1}`,
            current,
            power,
            status: isActive ? 'active' : 'inactive',
            breaker: isActive ? 'on' : 'off'
        });
    }

    circuits.sort((a, b) => b.power - a.power);

    return {
        pduId,
        circuits,
        totalCount: circuits.length
    };
}

function generatePDUHistory(pduId, period = '24h') {
    const now = new Date();
    const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = 60;

    const timestamps = [];
    const powerData = [];
    const currentData = [];

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * interval * 60000);
        timestamps.push(time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

        const basePower = 12 + Math.sin(i / 6) * 3;
        const noisePower = (Math.random() - 0.5) * 2;
        const power = Math.round(Math.max(5, Math.min(18, basePower + noisePower)) * 10) / 10;
        powerData.push(power);
        currentData.push(Math.round((power * 1000 / 220) * 10) / 10);
    }

    return {
        pduId,
        period,
        timestamps,
        power: powerData,
        current: currentData
    };
}

// ======================
// CRAC MOCK DATA GENERATORS
// ======================

function generateCRAC(id) {
    const supplyTemp = Math.round((16 + Math.random() * 4) * 10) / 10;
    const returnTemp = Math.round((22 + Math.random() * 6) * 10) / 10;
    const humidity = Math.round((40 + Math.random() * 20) * 10) / 10;

    let status = 'normal';
    if (returnTemp >= 32 || humidity < 30 || humidity > 70) status = 'critical';
    else if (returnTemp >= 28 || humidity < 40 || humidity > 60) status = 'warning';

    const modes = ['cooling', 'cooling', 'cooling', 'heating', 'dehumidifying', 'standby'];
    const compressorStates = ['running', 'running', 'running', 'idle', 'fault'];

    const asset = ALL_ASSETS.find(a => a.id === id);

    return {
        id,
        name: `CRAC ${id.split('-')[1]}`,
        roomId: asset?.roomId || null,
        supplyTemp,
        returnTemp,
        setpoint: 18.0,
        humidity,
        humiditySetpoint: 50,
        fanSpeed: Math.round((60 + Math.random() * 40) * 10) / 10,
        compressorStatus: compressorStates[Math.floor(Math.random() * compressorStates.length)],
        coolingCapacity: Math.round((70 + Math.random() * 30) * 10) / 10,
        status,
        mode: modes[Math.floor(Math.random() * modes.length)],
        threshold: {
            tempWarning: 28,
            tempCritical: 32,
            humidityLow: 30,
            humidityHigh: 70
        },
        lastUpdated: new Date().toISOString()
    };
}

function generateCRACHistory(cracId, period = '24h') {
    const now = new Date();
    const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = 60;

    const timestamps = [];
    const supplyTempData = [];
    const returnTempData = [];
    const humidityData = [];

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * interval * 60000);
        timestamps.push(time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

        const baseSupply = 18 + Math.sin(i / 8) * 1;
        supplyTempData.push(Math.round((baseSupply + (Math.random() - 0.5) * 2) * 10) / 10);

        const baseReturn = 24 + Math.sin(i / 6) * 2;
        returnTempData.push(Math.round((baseReturn + (Math.random() - 0.5) * 3) * 10) / 10);

        const baseHumidity = 50 + Math.sin(i / 10) * 5;
        humidityData.push(Math.round(Math.max(35, Math.min(65, baseHumidity + (Math.random() - 0.5) * 8)) * 10) / 10);
    }

    return {
        cracId,
        period,
        timestamps,
        supplyTemp: supplyTempData,
        returnTemp: returnTempData,
        humidity: humidityData
    };
}

// ======================
// SENSOR MOCK DATA GENERATORS
// ======================

function generateSensor(id) {
    const temperature = Math.round((20 + Math.random() * 10) * 10) / 10;
    const humidity = Math.round((35 + Math.random() * 30) * 10) / 10;
    const dewpoint = Math.round((temperature - ((100 - humidity) / 5)) * 10) / 10;

    let status = 'normal';
    if (temperature >= 32 || humidity < 30 || humidity > 70) status = 'critical';
    else if (temperature >= 28 || humidity < 40 || humidity > 60) status = 'warning';

    const asset = ALL_ASSETS.find(a => a.id === id);

    return {
        id,
        name: `Sensor ${id.split('-')[1]}`,
        roomId: asset?.roomId || null,
        temperature,
        humidity,
        dewpoint,
        status,
        threshold: {
            tempWarning: 28,
            tempCritical: 32,
            humidityLow: 30,
            humidityHigh: 70
        },
        lastUpdated: new Date().toISOString()
    };
}

function generateSensorHistory(sensorId, period = '24h') {
    const now = new Date();
    const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = 60;

    const timestamps = [];
    const temperatures = [];
    const humidityData = [];

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * interval * 60000);
        timestamps.push(time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

        const baseTemp = 24 + Math.sin(i / 6) * 2;
        temperatures.push(Math.round((baseTemp + (Math.random() - 0.5) * 3) * 10) / 10);

        const baseHumidity = 50 + Math.sin(i / 8) * 5;
        humidityData.push(Math.round(Math.max(35, Math.min(65, baseHumidity + (Math.random() - 0.5) * 8)) * 10) / 10);
    }

    return {
        sensorId,
        period,
        timestamps,
        temperatures,
        humidity: humidityData
    };
}

// ======================
// SUMMARY GENERATOR
// ======================

function generateAssetsSummary(assets) {
    const byType = {};
    const byStatus = { normal: 0, warning: 0, critical: 0 };

    assets.forEach(asset => {
        byType[asset.type] = (byType[asset.type] || 0) + 1;
        byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
    });

    return {
        total: assets.length,
        byType,
        byStatus
    };
}

// ======================
// API ENDPOINTS - Hierarchy (NEW)
// ======================

app.get('/api/hierarchy', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();
    console.log(`[${new Date().toISOString()}] GET /api/hierarchy`);
    res.json({ data: HIERARCHY_CACHE });
});

app.get('/api/hierarchy/:nodeId/assets', (req, res) => {
    const { nodeId } = req.params;

    if (!HIERARCHY_CACHE) initializeHierarchy();

    let assets = [];
    let nodeName = '';
    let nodeType = '';

    if (nodeId.startsWith('room-')) {
        assets = ASSETS_BY_ROOM[nodeId] || [];
        const room = findNodeById(nodeId);
        nodeName = room?.name || nodeId;
        nodeType = 'room';
    } else if (nodeId.startsWith('floor-')) {
        const floor = findNodeById(nodeId);
        nodeName = floor?.name || nodeId;
        nodeType = 'floor';
        (floor?.children || []).forEach(room => {
            assets = assets.concat(ASSETS_BY_ROOM[room.id] || []);
        });
    } else if (nodeId.startsWith('building-')) {
        const building = findNodeById(nodeId);
        nodeName = building?.name || nodeId;
        nodeType = 'building';
        (building?.children || []).forEach(floor => {
            (floor.children || []).forEach(room => {
                assets = assets.concat(ASSETS_BY_ROOM[room.id] || []);
            });
        });
    }

    const nodePath = getNodePath(nodeId);
    const summary = generateAssetsSummary(assets);

    console.log(`[${new Date().toISOString()}] GET /api/hierarchy/${nodeId}/assets - ${assets.length} assets`);

    res.json({
        data: {
            nodeId,
            nodeName,
            nodePath,
            nodeType,
            assets,
            summary
        }
    });
});

// ======================
// API ENDPOINTS - Assets (Updated)
// ======================

app.get('/api/assets/summary', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();
    const summary = generateAssetsSummary(ALL_ASSETS);
    console.log(`[${new Date().toISOString()}] GET /api/assets/summary`);
    res.json({ data: { summary } });
});

app.get('/api/assets', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();

    const { type, roomId } = req.query;
    let filteredAssets = [...ALL_ASSETS];

    if (type) {
        const types = type.split(',');
        filteredAssets = filteredAssets.filter(asset => types.includes(asset.type));
    }

    if (roomId) {
        filteredAssets = filteredAssets.filter(asset => asset.roomId === roomId);
    }

    const summary = generateAssetsSummary(filteredAssets);
    console.log(`[${new Date().toISOString()}] GET /api/assets - ${filteredAssets.length} assets`);
    res.json({ data: { assets: filteredAssets, summary } });
});

app.get('/api/asset/:id', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();

    const { id } = req.params;
    const asset = ALL_ASSETS.find(a => a.id === id);

    console.log(`[${new Date().toISOString()}] GET /api/asset/${id} - ${asset ? 'found' : 'not found'}`);

    if (!asset) {
        return res.status(404).json({ error: 'Asset not found', id });
    }
    res.json({ data: asset });
});

app.post('/api/assets/validate', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids array is required' });
    }

    const validIds = [];
    const invalidIds = [];

    ids.forEach(id => {
        if (ALL_ASSETS.find(a => a.id === id)) {
            validIds.push(id);
        } else {
            invalidIds.push(id);
        }
    });

    console.log(`[${new Date().toISOString()}] POST /api/assets/validate - ${ids.length} ids, ${validIds.length} valid`);
    res.json({ data: { validIds, invalidIds } });
});

// ======================
// API ENDPOINTS - UPS
// ======================

app.get('/api/ups/:id', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();
    const { id } = req.params;
    const ups = generateUPS(id);
    console.log(`[${new Date().toISOString()}] GET /api/ups/${id}`);
    res.json({ data: ups });
});

app.get('/api/ups/:id/history', (req, res) => {
    const { id } = req.params;
    const { period = '24h' } = req.query;
    const history = generateUPSHistory(id, period);
    console.log(`[${new Date().toISOString()}] GET /api/ups/${id}/history?period=${period}`);
    res.json({ data: history });
});

// ======================
// API ENDPOINTS - PDU
// ======================

app.get('/api/pdu/:id', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();
    const { id } = req.params;
    const pdu = generatePDU(id);
    console.log(`[${new Date().toISOString()}] GET /api/pdu/${id}`);
    res.json({ data: pdu });
});

app.get('/api/pdu/:id/circuits', (req, res) => {
    const { id } = req.params;
    const circuits = generatePDUCircuits(id);
    console.log(`[${new Date().toISOString()}] GET /api/pdu/${id}/circuits`);
    res.json({ data: circuits });
});

app.get('/api/pdu/:id/history', (req, res) => {
    const { id } = req.params;
    const { period = '24h' } = req.query;
    const history = generatePDUHistory(id, period);
    console.log(`[${new Date().toISOString()}] GET /api/pdu/${id}/history?period=${period}`);
    res.json({ data: history });
});

// ======================
// API ENDPOINTS - CRAC
// ======================

app.get('/api/crac/:id', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();
    const { id } = req.params;
    const crac = generateCRAC(id);
    console.log(`[${new Date().toISOString()}] GET /api/crac/${id}`);
    res.json({ data: crac });
});

app.get('/api/crac/:id/history', (req, res) => {
    const { id } = req.params;
    const { period = '24h' } = req.query;
    const history = generateCRACHistory(id, period);
    console.log(`[${new Date().toISOString()}] GET /api/crac/${id}/history?period=${period}`);
    res.json({ data: history });
});

// ======================
// API ENDPOINTS - Sensor
// ======================

app.get('/api/sensor/:id', (req, res) => {
    if (!HIERARCHY_CACHE) initializeHierarchy();
    const { id } = req.params;
    const sensor = generateSensor(id);
    console.log(`[${new Date().toISOString()}] GET /api/sensor/${id}`);
    res.json({ data: sensor });
});

app.get('/api/sensor/:id/history', (req, res) => {
    const { id } = req.params;
    const { period = '24h' } = req.query;
    const history = generateSensorHistory(id, period);
    console.log(`[${new Date().toISOString()}] GET /api/sensor/${id}/history?period=${period}`);
    res.json({ data: history });
});

// ======================
// SERVER START
// ======================

// Initialize hierarchy on startup
initializeHierarchy();

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  ECO Mock Server`);
    console.log(`  Environmental Control & Operations`);
    console.log(`  Running on http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`\nHierarchy Structure:`);
    console.log(`  Buildings: ${HIERARCHY_CACHE.summary.buildings}`);
    console.log(`  Floors: ${HIERARCHY_CACHE.summary.floors}`);
    console.log(`  Rooms: ${HIERARCHY_CACHE.summary.rooms}`);
    console.log(`  Assets: ${HIERARCHY_CACHE.summary.assets}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET /api/hierarchy                - Hierarchy tree`);
    console.log(`  GET /api/hierarchy/:nodeId/assets - Assets by node`);
    console.log(`  GET /api/assets                   - All assets`);
    console.log(`  GET /api/assets?type=ups          - Filter by type`);
    console.log(`  GET /api/assets?roomId=room-xxx   - Filter by room`);
    console.log(`  GET /api/assets/summary           - Summary only`);
    console.log(`  GET /api/asset/:id                - Single asset`);
    console.log(`  POST /api/assets/validate         - Batch validate`);
    console.log(`  GET /api/ups/:id                  - UPS status`);
    console.log(`  GET /api/ups/:id/history          - UPS history`);
    console.log(`  GET /api/pdu/:id                  - PDU status`);
    console.log(`  GET /api/pdu/:id/circuits         - PDU circuits`);
    console.log(`  GET /api/pdu/:id/history          - PDU history`);
    console.log(`  GET /api/crac/:id                 - CRAC status`);
    console.log(`  GET /api/crac/:id/history         - CRAC history`);
    console.log(`  GET /api/sensor/:id               - Sensor status`);
    console.log(`  GET /api/sensor/:id/history       - Sensor history`);
    console.log(`\n`);
});
