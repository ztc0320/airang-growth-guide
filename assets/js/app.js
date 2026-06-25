var App = (function(){
  var state = {monthlyGuide:null, foodWarning:null, config:null, krOverlay:null, krFeeding:null, krCheckup:null, krFoodWarning:null, krSleepSafety:null, krKdstPolicy:null, krSources:null, baby:null, babyAge:null, guide:null, krGuide:null, deferredInstallPrompt:null, isAnimating:false};

  function init(){
    setDateLimits();
    registerServiceWorker();
    bindInstallPrompt();
    bindEvents();
    window.addEventListener('hashchange', routeHash);
    updateInstallGuide();
    loadData().done(function(){ boot(); }).fail(function(){ showFatal('JSON 데이터를 불러오지 못했습니다. 로컬 서버 또는 정적 호스팅 환경에서 실행해 주세요.'); });
  }

  function loadData(){
    return $.when(
      $.getJSON('./assets/data/monthly-guide.json'),
      $.getJSON('./assets/data/food-warning.json'),
      $.getJSON('./assets/data/app-config.json'),
      $.getJSON('./assets/data/kr-monthly-overlay.json'),
      $.getJSON('./assets/data/kr-feeding-stage-guide.json'),
      $.getJSON('./assets/data/kr-health-checkup-guide.json'),
      $.getJSON('./assets/data/kr-food-warning.json'),
      $.getJSON('./assets/data/kr-sleep-safety-guide.json'),
      $.getJSON('./assets/data/kr-kdst-policy.json'),
      $.getJSON('./assets/data/kr-official-sources.json')
    ).done(function(monthly, food, config, krOverlay, krFeeding, krCheckup, krFoodWarning, krSleepSafety, krKdstPolicy, krSources){
      state.monthlyGuide = monthly[0];
      state.foodWarning = food[0];
      state.config = config[0];
      state.krOverlay = krOverlay[0];
      state.krFeeding = krFeeding[0];
      state.krCheckup = krCheckup[0];
      state.krFoodWarning = krFoodWarning[0];
      state.krSleepSafety = krSleepSafety[0];
      state.krKdstPolicy = krKdstPolicy[0];
      state.krSources = krSources[0];
    });
  }

  function boot(){
    if(!Storage.hasBaby()){
      $('#onboarding').addClass('is-active');
      $('#headerTitle').text('시작하기');
      renderStaticSettingText();
      return;
    }
    $('#onboarding').removeClass('is-active');
    refresh();
    routeHash();
  }

  function refresh(){
    state.baby = Storage.getBaby();
    state.babyAge = BabyCalc.getBabyAge(state.baby.birthDate);
    if(!state.babyAge){ $('#onboarding').addClass('is-active'); return; }
    state.guide = state.monthlyGuide[String(state.babyAge.guideMonth)];
    state.krGuide = getKoreaMonthGuide(state.babyAge.guideMonth);
    if(!state.guide){ showFatal('현재 월령 데이터를 찾을 수 없습니다.'); return; }
    $('#headerTitle').text((state.baby.name || '우리 아이') + ' 가이드');
    Renderer.renderHome(state.guide, state.babyAge, state.baby, state.krGuide);
    Renderer.renderGrowth(state.guide, state.krGuide, state.krKdstPolicy);
    Renderer.renderMeal(state.guide, state.foodWarning, state.babyAge.guideMonth, state.krGuide, state.krFoodWarning);
    Renderer.renderPlay(state.guide);
    Renderer.renderChecklist(state.guide, state.babyAge.guideMonth, state.krGuide);
    Renderer.renderSetting(state.baby, state.guide, null, state.krSources, state.krKdstPolicy);
    renderStaticSettingText();
    NotificationManager.checkMonthChanged(state.babyAge, state.baby.notificationEnabled);
  }

  function getKoreaMonthGuide(month){
    if(!state.krOverlay){ return null; }
    if(state.krOverlay.months){ return state.krOverlay.months[String(month)] || null; }
    return state.krOverlay[String(month)] || null;
  }

  function bindEvents(){
    $('#babyForm').on('submit', function(e){
      e.preventDefault();
      saveBabyFromForm('#babyName', '#babyBirthDate', '#notificationEnabled', function(){ boot(); });
    });

    $('#settingForm').on('submit', function(e){
      e.preventDefault();
      saveBabyFromForm('#settingBabyName', '#settingBabyBirthDate', '#settingNotificationEnabled', function(){ refresh(); showToast('저장되었습니다.'); });
    });

    $('.bottom-nav').on('click', '.nav-btn', function(){ showPage($(this).data('page')); });
    $('#btnOpenSetting').on('click', function(){ showPage('pageSetting'); });

    $(document).on('change', '.check-item input', function(){
      var $input = $(this);
      Storage.setChecklist($input.data('month'), $input.data('group'), $input.data('index'), $input.is(':checked'));
      refreshChecklistOnly();
    });

    $('#btnResetData').on('click', function(){
      if(confirm('이 기기에 저장된 아이 정보와 체크 기록을 모두 삭제할까요?')){
        Storage.resetAll();
        location.reload();
      }
    });

    $('#btnValidateData').on('click', function(){
      if(typeof validateMonthlyGuide !== 'function'){
        $('#validationResult').text('검증 함수를 찾지 못했습니다.');
        return;
      }
      var result = validateMonthlyGuide(state.monthlyGuide);
      var krResult = validateKoreaOverlay(state.krOverlay);
      var message = result.valid ? 'CDC 데이터 통과: 0~60개월 key와 필수 필드가 확인되었습니다.' : 'CDC 데이터 오류: ' + result.errors.slice(0, 5).join(' / ');
      message += krResult.valid ? ' / 한국 보강 데이터 통과: 0~60개월 key 확인.' : ' / 한국 보강 데이터 오류: ' + krResult.errors.slice(0, 5).join(' / ');
      $('#validationResult').text(message);
    });

    $('#btnInstallApp').on('click', function(){
      if(!state.deferredInstallPrompt){ updateInstallGuide(); return; }
      state.deferredInstallPrompt.prompt();
      state.deferredInstallPrompt.userChoice.finally(function(){
        state.deferredInstallPrompt = null;
        $('#btnInstallApp').prop('disabled', true).text('설치 완료 또는 취소됨');
        updateInstallGuide();
      });
    });
  }

  function validateKoreaOverlay(data){
    var result = {valid:true, errors:[]};
    var months = data && data.months ? data.months : data;
    if(!months){ return {valid:false, errors:['kr-monthly-overlay.json을 불러오지 못했습니다.']}; }
    for(var i = 0; i <= 60; i++){
      if(!months[String(i)]){ result.valid = false; result.errors.push(i + '개월 한국 보강 데이터 누락'); }
    }
    return result;
  }

  function saveBabyFromForm(nameSelector, birthSelector, notificationSelector, done){
    var name = $.trim($(nameSelector).val()) || '우리 아이';
    var birthDate = $(birthSelector).val();
    if(!birthDate){ alert('아이 생년월일을 입력해 주세요.'); return; }
    if(isFutureDate(birthDate)){ alert('생년월일은 오늘 이후 날짜로 입력할 수 없습니다.'); return; }
    Storage.setBaby({name:name,birthDate:birthDate,notificationEnabled:$(notificationSelector).is(':checked')});
    if($(notificationSelector).is(':checked')){ NotificationManager.requestPermission(); }
    done();
  }

  function isFutureDate(value){
    var d = BabyCalc.parseDate(value);
    if(!d){ return true; }
    var today = new Date();
    var startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d > startToday;
  }

  function setDateLimits(){
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var value = yyyy + '-' + mm + '-' + dd;
    $('#babyBirthDate, #settingBabyBirthDate').attr('max', value);
  }

  function bindInstallPrompt(){
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();
      state.deferredInstallPrompt = e;
      $('#btnInstallApp').prop('disabled', false).text('앱 설치하기');
      $('#installGuide').text('이 기기에서 앱처럼 설치할 수 있습니다.');
    });
    window.addEventListener('appinstalled', function(){
      state.deferredInstallPrompt = null;
      updateInstallGuide();
    });
  }

  function updateInstallGuide(){
    var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if(isStandalone){
      $('#installGuide').text('홈 화면 앱 모드로 실행 중입니다.');
      $('#installSteps').html('');
      $('#btnInstallApp').prop('disabled', true).text('설치됨');
      return;
    }
    if(isIos){
      $('#installGuide').text('iPhone에서는 Safari 공유 메뉴에서 홈 화면에 추가할 수 있습니다.');
      $('#installSteps').html('<ol class="mini-steps"><li>Safari에서 이 사이트를 엽니다.</li><li>하단 공유 버튼을 누릅니다.</li><li>“홈 화면에 추가”를 선택합니다.</li></ol>');
      $('#btnInstallApp').prop('disabled', true).text('Safari에서 홈 화면에 추가');
      return;
    }
    if(!state.deferredInstallPrompt){
      $('#installGuide').text('Chrome 또는 Edge 메뉴에서 “앱 설치”나 “홈 화면에 추가”를 사용할 수 있습니다.');
      $('#installSteps').html('');
      $('#btnInstallApp').prop('disabled', true).text('설치 조건 확인 중');
    }
  }

  function routeHash(){
    var hash = String(location.hash || '').replace('#','');
    var map = {home:'pageHome',growth:'pageGrowth',meal:'pageMeal',play:'pagePlay',check:'pageCheck',setting:'pageSetting'};
    if(map[hash]){ showPage(map[hash]); }
  }

  function renderStaticSettingText(){
    var version = state.config && state.config.version ? state.config.version : '1.0.0';
    var reviewedAt = state.config && state.config.reviewedAt ? state.config.reviewedAt : '2026-06-25';
    $('#appVersionText').text('앱 버전 ' + version + ' · 콘텐츠 검수 기준일 ' + reviewedAt + ' · 한국 공식자료 보강 포함');
  }

  function refreshChecklistOnly(){
    if(!state.guide || !state.babyAge){ return; }
    Renderer.renderHome(state.guide, state.babyAge, state.baby, state.krGuide);
    Renderer.renderChecklist(state.guide, state.babyAge.guideMonth, state.krGuide);
  }

  function showPage(pageId){
    if(state.isAnimating){ return; }
    var $current = $('.page.is-active');
    var $next = $('#' + pageId);
    if(!$next.length || $next.hasClass('is-active')){ return; }
    state.isAnimating = true;
    $current.addClass('is-leaving');
    $next.addClass('is-active');
    setTimeout(function(){
      $current.removeClass('is-active is-leaving');
      state.isAnimating = false;
    }, 180);
    $('.nav-btn').removeClass('is-active').removeAttr('aria-current');
    $('.nav-btn[data-page="' + pageId + '"]').addClass('is-active').attr('aria-current','page');
    setHeaderTitle(pageId);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function setHeaderTitle(pageId){
    if(pageId === 'pageHome'){ $('#headerTitle').text((state.baby && state.baby.name ? state.baby.name : '우리 아이') + ' 가이드'); }
    if(pageId === 'pageGrowth'){ $('#headerTitle').text('성장'); }
    if(pageId === 'pageMeal'){ $('#headerTitle').text('식사'); }
    if(pageId === 'pagePlay'){ $('#headerTitle').text('놀이'); }
    if(pageId === 'pageCheck'){ $('#headerTitle').text('체크'); }
    if(pageId === 'pageSetting'){ $('#headerTitle').text('설정'); updateInstallGuide(); }
  }

  function showToast(message){
    var $toast = $('<div class="notice-banner toast" role="status" aria-live="polite"></div>').text(message).css({position:'fixed',left:'16px',right:'16px',bottom:'88px',zIndex:60,textAlign:'center'});
    $('body').append($toast);
    setTimeout(function(){ $toast.remove(); }, 1400);
  }

  function showFatal(message){
    alert(message);
  }

  function registerServiceWorker(){
    if('serviceWorker' in navigator && location.protocol !== 'file:'){
      navigator.serviceWorker.register('./service-worker.js').catch(function(error){ console.warn('service worker registration failed', error); });
    }
  }

  return {init:init,refresh:refresh};
})();

$(function(){
  App.init();
});
