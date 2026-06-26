var ProductsApp = (function(){
  var state = {data:null,baby:null,babyAge:null,currentMonth:0};

  function init(){
    registerServiceWorker();
    bindEvents();
    loadData().done(function(){ boot(); }).fail(function(){ showFatal('준비물 데이터를 불러오지 못했습니다.'); });
  }

  function loadData(){
    return $.getJSON('./assets/data/recommended-products.json').done(function(response){ state.data = response[0]; });
  }

  function boot(){
    state.baby = Storage.getBaby();
    state.babyAge = state.baby && state.baby.birthDate ? BabyCalc.getBabyAge(state.baby.birthDate) : null;
    state.currentMonth = state.babyAge ? state.babyAge.guideMonth : 0;
    renderMonthSelect();
    $('#productMonthSelect').val(String(state.currentMonth));
    renderCurrentMonth();
  }

  function bindEvents(){
    $('#productMonthSelect').on('change', function(){ state.currentMonth = Number($(this).val()); renderCurrentMonth(); });
  }

  function renderMonthSelect(){
    var $select = $('#productMonthSelect').empty();
    for(var i = 0; i <= 60; i++){ $select.append($('<option></option>').attr('value', i).text(i + '개월')); }
  }

  function renderCurrentMonth(){
    var monthData = getMonthData(state.currentMonth);
    if(!monthData){ showFatal('선택한 월령의 준비물 데이터를 찾을 수 없습니다.'); return; }
    var babyName = state.baby && state.baby.name ? state.baby.name : '우리 아이';
    $('#productsHeaderTitle').text(monthData.title);
    $('#productsTitle').text(monthData.title);
    $('#productsIntro').text(state.babyAge ? babyName + '의 현재 기준 월령은 생후 ' + state.babyAge.guideMonth + '개월입니다.' : '아이 정보를 입력하면 현재 월령에 맞는 준비물을 먼저 보여줍니다.');
    $('#productsSummary').text(monthData.summary || '아이의 발달 상태와 가정환경에 따라 필요한 것만 선택해 준비하세요.');
    $('#productDisclaimer').text((state.data.metadata && state.data.metadata.disclaimer) || '이 목록은 일반적인 육아용품 예시이며, 실제 필요 여부는 아이마다 다를 수 있습니다.');
    renderCategories(monthData.categories || []);
  }

  function getMonthData(month){
    if(!state.data || !state.data.months){ return null; }
    return state.data.months[String(month)] || null;
  }

  function renderCategories(categories){
    var $wrap = $('#productCategoryList').empty();
    if(!categories.length){ $wrap.append('<article class="card"><p class="empty-text">이 월령에는 별도 준비물 항목이 없습니다.</p></article>'); return; }
    $.each(categories, function(_, category){
      var $card = $('<article class="product-card"></article>');
      $card.append($('<h3></h3>').text(category.title || '준비물'));
      var $list = $('<div class="product-list"></div>');
      $.each(category.items || [], function(_, item){ $list.append(makeProductItem(item)); });
      $card.append($list);
      $wrap.append($card);
    });
  }

  function makeProductItem(item){
    var $item = $('<div class="product-item"></div>');
    var $head = $('<div class="product-item-head"></div>');
    $head.append($('<strong></strong>').text(item.name || '준비물'));
    $head.append($('<span></span>').addClass('product-priority ' + (item.priority || 'medium')).text(priorityLabel(item.priority)));
    $item.append($head);
    if(item.reason){ $item.append($('<p></p>').text(item.reason)); }
    if(item.caution){ $item.append($('<p class="product-caution"></p>').text(item.caution)); }
    if(item.searchKeyword){
      var url = 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent(item.searchKeyword);
      $item.append($('<a class="product-search" target="_blank" rel="noopener"></a>').attr('href', url).text('쇼핑 검색어 보기'));
    }
    return $item;
  }

  function priorityLabel(priority){
    if(priority === 'high'){ return '우선'; }
    if(priority === 'low'){ return '선택'; }
    return '상황별';
  }

  function showFatal(message){
    $('#productCategoryList').html('<article class="card warning-card"><p>' + message + '</p></article>');
  }

  function registerServiceWorker(){
    if('serviceWorker' in navigator && location.protocol !== 'file:'){
      navigator.serviceWorker.register('./service-worker.js').catch(function(error){ console.warn('service worker registration failed', error); });
    }
  }

  return {init:init};
})();

$(function(){
  ProductsApp.init();
});
