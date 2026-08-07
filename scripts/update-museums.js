const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const API_URL = 'https://api.data.go.kr/openapi/tn_pubr_public_museum_artgr_info_api';
const OUTPUT_FILE = path.join(ROOT, 'assets', 'data', 'museums.json');
const MANUAL_FILE = path.join(ROOT, 'assets', 'data', 'manual-museums.json');
const OVERRIDES_FILE = path.join(ROOT, 'assets', 'data', 'reservation-overrides.json');
const MIN_API_MUSEUMS = 100;
const MIN_RETAINED_RATIO = 0.5;
const REQUEST_ATTEMPTS = 3;

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function run() {
  const serviceKey = normalizeServiceKey(process.env.PUBLIC_DATA_SERVICE_KEY);
  if (!serviceKey) {
    throw new Error('GitHub Secret PUBLIC_DATA_SERVICE_KEY가 설정되지 않았습니다.');
  }

  const currentMuseums = readJson(OUTPUT_FILE, []);
  const firstPage = await requestPage(serviceKey, 1);
  const pageSize = 1000;
  const totalCount = Number(firstPage.totalCount || firstPage.items.length);
  const pageCount = Math.max(Math.ceil(totalCount / pageSize), 1);
  let rawItems = firstPage.items;

  for (let page = 2; page <= pageCount; page += 1) {
    const nextPage = await requestPage(serviceKey, page);
    rawItems = rawItems.concat(nextPage.items);
  }

  const overrides = readJson(OVERRIDES_FILE, {});
  const apiMuseums = uniqueById(rawItems
    .map(normalizeMuseum)
    .filter(hasCoordinates)
    .map((museum) => ({ ...museum, ...(overrides[museum.name] || {}) })));
  const manualMuseums = readJson(MANUAL_FILE, []);
  validateMuseumCount(apiMuseums, currentMuseums);
  const museums = uniqueById(apiMuseums.concat(manualMuseums)).sort(sortMuseums);

  if (!museums.length) {
    throw new Error('저장할 박물관 데이터가 없습니다.');
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(museums, null, 2) + '\n', 'utf8');
  console.log(`${museums.length}개 시설을 assets/data/museums.json에 저장했습니다.`);
}

async function requestPage(serviceKey, pageNo) {
  const url = new URL(API_URL);
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('type', 'json');
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', '1000');

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`공공데이터 API 요청 실패: HTTP ${response.status}`);
  }

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    const apiError = extractXmlValue(responseText, 'returnAuthMsg') || extractXmlValue(responseText, 'errMsg') || extractXmlValue(responseText, 'resultMsg');
    throw new Error(apiError ? `공공데이터 API 오류: ${apiError}` : '공공데이터 API가 JSON이 아닌 응답을 반환했습니다.');
  }

  const serviceError = data.OpenAPI_ServiceResponse?.cmmMsgHeader || data.cmmMsgHeader;
  if (serviceError) {
    throw new Error(`공공데이터 API 오류: ${serviceError.returnAuthMsg || serviceError.errMsg || serviceError.returnReasonCode}`);
  }

  const header = data.response?.header;
  if (header && String(header.resultCode) !== '00') {
    throw new Error(`공공데이터 API 오류: ${header.resultMsg || header.resultCode}`);
  }

  const body = data.response?.body || data;
  const value = Array.isArray(body) ? body : body.items?.item || body.items || [];
  return {
    items:Array.isArray(value) ? value : [value],
    totalCount:body.totalCount || 0
  };
}

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { signal:AbortSignal.timeout(30000) });
      if (response.ok || response.status < 500) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < REQUEST_ATTEMPTS) {
      await wait(attempt * 1000);
    }
  }
  throw new Error(`공공데이터 API 요청 실패: ${lastError?.message || '알 수 없는 오류'}`);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function validateMuseumCount(apiMuseums, currentMuseums) {
  const previousApiCount = currentMuseums.filter((museum) => museum.dataSourceName === '공공데이터포털 전국박물관미술관정보표준데이터').length;
  const minimumCount = previousApiCount >= MIN_API_MUSEUMS
    ? Math.max(MIN_API_MUSEUMS, Math.floor(previousApiCount * MIN_RETAINED_RATIO))
    : MIN_API_MUSEUMS;
  if (apiMuseums.length < minimumCount) {
    throw new Error(`공공데이터 시설이 ${apiMuseums.length}개만 확인되어 기존 ${currentMuseums.length}개 데이터를 유지합니다.`);
  }
}

function normalizeMuseum(item) {
  const name = clean(item.fcltyNm);
  const address = clean(item.rdnmadr || item.lnmadr);
  const isChildren = /어린이|아동|키즈/i.test(`${name} ${item.fcltyIntrcn || ''}`);
  const type = isChildren ? '어린이박물관' : /미술관|갤러리|아트센터|아트뮤지엄/i.test(name) ? '미술관' : '박물관';

  return {
    id:crypto.createHash('sha1').update(`${name}|${address}`).digest('hex').slice(0, 16),
    name,
    type,
    ownershipType:clean(item.fcltyType),
    address,
    latitude:Number(item.latitude),
    longitude:Number(item.longitude),
    phone:clean(item.operPhoneNumber || item.phoneNumber),
    homepageUrl:safeUrl(item.homepageUrl),
    reservationUrl:'',
    reservationType:'',
    weekdayOpen:clean(item.weekdayOperOpenHhmm),
    weekdayClose:clean(item.weekdayOperColseHhmm),
    holidayOpen:clean(item.holidayOperOpenHhmm),
    holidayClose:clean(item.holidayCloseOpenHhmm),
    closedInfo:clean(item.rstdeInfo),
    adultCharge:clean(item.adultChrge),
    youthCharge:clean(item.yngbgsChrge),
    childCharge:clean(item.childChrge),
    chargeInfo:clean(item.etcChrgeInfo),
    description:clean(item.fcltyIntrcn),
    referenceDate:clean(item.referenceDate),
    isChildren,
    dataSourceName:'공공데이터포털 전국박물관미술관정보표준데이터',
    dataSourceUrl:'https://www.data.go.kr/data/15017323/standard.do'
  };
}

function uniqueById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function sortMuseums(a, b) {
  if (Boolean(a.isChildren) !== Boolean(b.isChildren)) {
    return a.isChildren ? -1 : 1;
  }
  return String(a.name).localeCompare(String(b.name), 'ko');
}

function hasCoordinates(item) {
  return item.name && Number.isFinite(item.latitude) && Number.isFinite(item.longitude);
}

function normalizeServiceKey(value) {
  let key = clean(value).replace(/^['"]|['"]$/g, '');
  if (/%[0-9A-Fa-f]{2}/.test(key)) {
    try {
      key = decodeURIComponent(key);
    } catch {
      return key;
    }
  }
  return key;
}

function safeUrl(value) {
  const text = clean(value);
  if (!text) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function extractXmlValue(xml, tagName) {
  const match = String(xml).match(new RegExp(`<${tagName}>(?:<!\\[CDATA\\[)?([^<\\]]+)`, 'i'));
  return match ? match[1].trim() : '';
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function clean(value) {
  return String(value ?? '').trim();
}
