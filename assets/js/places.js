var PlacesApp = (function($){
  'use strict';

  var state = {
    map:null,
    data:[],
    filtered:[],
    type:'all',
    markers:{},
    markerLayer:null,
    current:null,
    currentMarker:null,
    currentCircle:null
  };

  function init(){
    if(typeof L === 'undefined'){
      showError('지도를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
      return;
    }
    initMap();
    bindEvents();
    loadData();
    registerServiceWorker();
    window.addEventListener('resize', refreshMapSize);
    window.addEventListener('orientationchange', refreshMapSize);
    window.addEventListener('load', refreshMapSize);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden){ refreshMapSize(); } });
    observeMapSize();
  }

  function initMap(){
    state.map = L.map('placeMap', {zoomControl:true}).setView([36.4, 127.8], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19,
      attribution:'&copy; OpenStreetMap contributors'
    }).addTo(state.map);
    state.markerLayer = L.layerGroup().addTo(state.map);
  }

  function bindEvents(){
    $('#placeSearchButton').on('click', function(){ applyFilters(true); });
    $('#placeKeyword').on('keydown', function(event){ if(event.key === 'Enter'){ applyFilters(true); } });
    $('.place-filter').on('click', function(){
      state.type = $(this).data('type');
      $('.place-filter').removeClass('is-active').attr('aria-pressed', 'false');
      $(this).addClass('is-active').attr('aria-pressed', 'true');
      applyFilters(true);
    });
    $('#placeCurrentLocation').on('click', findCurrentLocation);
    $('#placeDetailClose').on('click', closeDetail);
    $(document).on('keydown', function(event){ if(event.key === 'Escape'){ closeDetail(); } });
  }

  function loadData(){
    $.getJSON('./assets/data/museums.json?v=27').done(function(response){
      state.data = Array.isArray(response) ? response : [];
      applyFilters(true);
      if(state.data.length <= 4){
        $('#placeDataNotice').prop('hidden', false).text('전국 시설 데이터를 일시적으로 불러오지 못해 기본 등록 시설만 표시하고 있습니다. 잠시 후 다시 확인해 주세요.');
      }
    }).fail(function(){
      showError('박물관 데이터를 불러오지 못했습니다.');
    });
  }

  function applyFilters(fitBounds){
    var keyword = $.trim($('#placeKeyword').val()).toLowerCase();
    state.filtered = state.data.filter(function(item){
      var keywordMatch = !keyword || String(item.name + ' ' + item.address).toLowerCase().indexOf(keyword) > -1;
      var typeMatch = state.type === 'all' || item.type === state.type || (state.type === '박물관' && item.type.indexOf('박물관') > -1 && !item.isChildren);
      return keywordMatch && typeMatch;
    });

    if(state.current){
      state.filtered = state.filtered.map(function(item){
        var copy = Object.assign({}, item);
        copy.distance = calculateDistance(state.current.latitude, state.current.longitude, Number(item.latitude), Number(item.longitude));
        return copy;
      }).sort(function(a, b){ return a.distance - b.distance; });
    }else{
      state.filtered.sort(function(a, b){
        if(Boolean(a.isChildren) !== Boolean(b.isChildren)){ return a.isChildren ? -1 : 1; }
        return String(a.name).localeCompare(String(b.name), 'ko');
      });
    }

    renderList();
    renderMarkers(fitBounds);
    closeDetail();
  }

  function renderList(){
    var list = document.getElementById('museumList');
    list.innerHTML = '';
    $('#placeResultCount').text(state.filtered.length.toLocaleString());
    if(!state.filtered.length){
      list.innerHTML = '<li class="places-empty"><strong>검색 결과가 없습니다.</strong><span>다른 시설명이나 지역으로 검색해 보세요.</span></li>';
      return;
    }
    state.filtered.forEach(function(item){
      var li = document.createElement('li');
      var button = document.createElement('button');
      var meta = [];
      li.className = 'place-card';
      li.setAttribute('data-id', item.id);
      button.type = 'button';
      button.setAttribute('aria-label', item.name + ' 상세보기');
      if(formatHours(item)){ meta.push(escapeHtml(formatHours(item))); }
      if(formatCharge(item.childCharge)){ meta.push(escapeHtml(formatCharge(item.childCharge))); }
      if(Number.isFinite(item.distance)){ meta.push(escapeHtml(formatDistance(item.distance))); }
      button.innerHTML = '<span class="place-type ' + placeTypeClass(item) + '">' + escapeHtml(item.type) + '</span><h2>' + escapeHtml(item.name) + '</h2><p>' + escapeHtml(item.address || '주소 정보 없음') + '</p><div class="place-card-meta">' + meta.map(function(value){ return '<span>' + value + '</span>'; }).join('') + '</div>';
      button.addEventListener('click', function(){ selectPlace(item.id, true); });
      li.appendChild(button);
      list.appendChild(li);
    });
  }

  function renderMarkers(fitBounds){
    state.markerLayer.clearLayers();
    state.markers = {};
    var bounds = [];
    state.filtered.forEach(function(item){
      if(!isCoordinate(item)){ return; }
      var iconClass = item.isChildren ? 'children' : item.type.indexOf('미술관') > -1 ? 'art' : 'museum';
      var label = item.isChildren ? '어' : item.type.indexOf('미술관') > -1 ? '미' : '박';
      var icon = L.divIcon({
        className:'',
        html:'<div class="place-marker ' + iconClass + '"><span>' + label + '</span></div>',
        iconSize:[36, 36],
        iconAnchor:[18, 36]
      });
      var marker = L.marker([item.latitude, item.longitude], {icon:icon, title:item.name}).addTo(state.markerLayer);
      marker.on('click', function(){ selectPlace(item.id, false); });
      state.markers[item.id] = marker;
      bounds.push([item.latitude, item.longitude]);
    });
    if(fitBounds && bounds.length){ state.map.fitBounds(bounds, {padding:[36, 36], maxZoom:13}); }
  }

  function selectPlace(id, moveMap){
    var item = state.data.find(function(place){ return place.id === id; });
    var cards = document.querySelectorAll('.place-card');
    if(!item){ return; }
    Array.prototype.forEach.call(cards, function(card){ card.classList.toggle('is-active', card.getAttribute('data-id') === id); });
    var activeCard = document.querySelector('.place-card[data-id="' + id + '"]');
    if(activeCard){ activeCard.scrollIntoView({behavior:'smooth', block:'nearest'}); }
    if(moveMap && state.markers[id]){ state.map.setView([item.latitude, item.longitude], Math.max(state.map.getZoom(), 14), {animate:true}); }
    openDetail(item);
  }

  function openDetail(item){
    var content = document.getElementById('placeDetailContent');
    var homepage = safeUrl(item.homepageUrl);
    var reservation = safeUrl(item.reservationUrl || item.homepageUrl);
    var sourceUrl = safeUrl(item.dataSourceUrl || 'https://www.data.go.kr/data/15017323/standard.do');
    var actions = '';
    if(homepage && homepage !== reservation){ actions += '<a href="' + escapeAttribute(homepage) + '" target="_blank" rel="noopener noreferrer">공식 홈페이지</a>'; }
    if(reservation){ actions += '<a class="primary" href="' + escapeAttribute(reservation) + '" target="_blank" rel="noopener noreferrer">공식 사이트에서 예약 확인</a>'; }
    content.innerHTML = '<span class="place-type ' + placeTypeClass(item) + '">' + escapeHtml(item.type) + '</span>' +
      '<h2>' + escapeHtml(item.name) + '</h2>' +
      '<p class="place-detail-address">' + escapeHtml(item.address || '주소 정보 없음') + '</p>' +
      '<dl class="place-detail-info">' +
      infoRow('운영시간', formatHours(item) || '공식 홈페이지 확인') +
      infoRow('휴관일', item.closedInfo || '공식 홈페이지 확인') +
      infoRow('어린이 요금', formatCharge(item.childCharge) || '공식 홈페이지 확인') +
      infoRow('전화', item.phone || '정보 없음') +
      infoRow('예약', item.reservationType || '공식 사이트 확인') +
      '</dl>' +
      (item.description ? '<p class="place-detail-description">' + escapeHtml(item.description) + '</p>' : '') +
      (actions ? '<div class="place-detail-actions">' + actions + '</div>' : '') +
      '<p class="place-detail-source">정보 기준일: ' + escapeHtml(item.referenceDate || '확인 필요') + '</p>' +
      '<p class="place-detail-source">출처: <a href="' + escapeAttribute(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.dataSourceName || '공공데이터포털') + '</a></p>';
    $('#placeDetail').addClass('is-open').attr('aria-hidden', 'false');
  }

  function infoRow(title, value){
    return '<div><dt>' + escapeHtml(title) + '</dt><dd>' + escapeHtml(value) + '</dd></div>';
  }

  function closeDetail(){
    $('#placeDetail').removeClass('is-open').attr('aria-hidden', 'true');
    $('.place-card').removeClass('is-active');
  }

  function findCurrentLocation(){
    if(!navigator.geolocation){
      alert('현재 위치 기능을 지원하지 않는 브라우저입니다.');
      return;
    }
    $('#placeCurrentLocation').prop('disabled', true).text('위치 확인 중');
    navigator.geolocation.getCurrentPosition(function(position){
      state.current = {
        latitude:position.coords.latitude,
        longitude:position.coords.longitude,
        accuracy:position.coords.accuracy
      };
      showCurrentMarker();
      applyFilters(false);
      state.map.setView([state.current.latitude, state.current.longitude], 13, {animate:true});
      $('#placeCurrentLocation').prop('disabled', false).text('내 위치 다시 찾기');
      $('#placeLocationStatus').prop('hidden', false).text('내 위치에서 가까운 순으로 정렬했습니다.');
    }, function(){
      alert('현재 위치를 확인할 수 없습니다. 브라우저의 위치 권한을 확인해 주세요.');
      $('#placeCurrentLocation').prop('disabled', false).text('내 위치 주변');
    }, {enableHighAccuracy:true, timeout:10000, maximumAge:60000});
  }

  function showCurrentMarker(){
    if(state.currentMarker){ state.map.removeLayer(state.currentMarker); }
    if(state.currentCircle){ state.map.removeLayer(state.currentCircle); }
    var icon = L.divIcon({className:'', html:'<div class="place-current-marker"></div>', iconSize:[22, 22], iconAnchor:[11, 11]});
    state.currentCircle = L.circle([state.current.latitude, state.current.longitude], {
      radius:Math.max(state.current.accuracy, 20),
      color:'#0066d2',
      weight:1,
      fillColor:'#0066d2',
      fillOpacity:.1,
      interactive:false
    }).addTo(state.map);
    state.currentMarker = L.marker([state.current.latitude, state.current.longitude], {icon:icon, title:'내 위치', zIndexOffset:1000}).addTo(state.map);
  }

  function showError(message){
    $('#placeDataNotice').prop('hidden', false).text(message);
  }

  function refreshMapSize(){
    window.clearTimeout(refreshMapSize.timer);
    refreshMapSize.timer = window.setTimeout(function(){
      if(state.map){ state.map.invalidateSize(); }
    }, 160);
  }

  function observeMapSize(){
    if(!window.ResizeObserver){ return; }
    var panel = document.querySelector('.places-map-panel');
    if(!panel){ return; }
    state.mapSizeObserver = new ResizeObserver(function(){ refreshMapSize(); });
    state.mapSizeObserver.observe(panel);
  }

  function formatHours(item){
    return item.weekdayOpen && item.weekdayClose ? item.weekdayOpen + '–' + item.weekdayClose : '';
  }

  function placeTypeClass(item){
    if(item.isChildren){ return 'type-children'; }
    if(item.type.indexOf('미술관') > -1){ return 'type-art'; }
    return 'type-museum';
  }

  function formatCharge(value){
    if(value === '' || value === null || typeof value === 'undefined'){ return ''; }
    var number = Number(String(value).replace(/[^0-9.-]/g, ''));
    if(Number.isFinite(number)){ return number === 0 ? '무료' : number.toLocaleString() + '원'; }
    return String(value);
  }

  function calculateDistance(lat1, lon1, lat2, lon2){
    if(!Number.isFinite(lat2) || !Number.isFinite(lon2)){ return Infinity; }
    var radius = 6371;
    var dLat = toRadians(lat2 - lat1);
    var dLon = toRadians(lon2 - lon1);
    var value = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function toRadians(value){
    return value * Math.PI / 180;
  }

  function formatDistance(distance){
    return distance < 1 ? Math.round(distance * 1000) + 'm' : distance.toFixed(1) + 'km';
  }

  function isCoordinate(item){
    return Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
  }

  function safeUrl(value){
    if(!value){ return ''; }
    try {
      var url = new URL(value, location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch(error){
      return '';
    }
  }

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(character){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
    });
  }

  function escapeAttribute(value){
    return escapeHtml(value);
  }

  function registerServiceWorker(){
    if('serviceWorker' in navigator && location.protocol !== 'file:'){
      navigator.serviceWorker.register('./service-worker.js').catch(function(error){ console.warn('service worker registration failed', error); });
    }
  }

  return {init:init};
})(jQuery);

jQuery(function(){ PlacesApp.init(); });
