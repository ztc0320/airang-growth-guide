var Renderer = (function(){
  var labels = {
    motor: '운동 발달',
    language: '언어 발달',
    social: '사회성 발달',
    cognitive: '인지 발달',
    breastMilkFormula: '모유·분유',
    cowMilk: '우유 전환',
    meal: '식사 리듬',
    cupPractice: '컵 사용',
    texture: '질감 변화',
    caution: '식사 주의',
    grossMotor: '대근육 놀이',
    fineMotor: '소근육 놀이',
    sensory: '감각 놀이',
    interaction: '상호작용 놀이',
    development: '발달 체크',
    feeding: '식사 체크',
    sleep: '수면 체크',
    safety: '안전 체크'
  };

  function text(value){ return value || ''; }

  function safeItems(items){ return items && items.length ? items : []; }

  function renderList($target, items){
    $target.empty();
    if(!items || !items.length){
      $target.append('<p class="empty-text">이 월령에는 별도 항목이 없습니다.</p>');
      return;
    }
    var $ul = $('<ul class="text-list"></ul>');
    $.each(items, function(_, item){ $ul.append($('<li></li>').text(item)); });
    $target.append($ul);
  }

  function makeListCard(title, items, sub){
    var $card = $('<article class="card"></article>');
    var $head = $('<div class="group-title"></div>');
    $head.append($('<strong></strong>').text(title));
    if(sub){ $head.append($('<span></span>').text(sub)); }
    $card.append($head);
    renderList($card, items);
    return $card;
  }

  function makeKoreaCard(title, summary, items, cautionItems){
    var $card = $('<article class="card kr-card"></article>');
    $card.append($('<p class="eyebrow"></p>').text('한국 공식자료 기준'));
    $card.append($('<h3></h3>').text(title));
    if(summary){ $card.append($('<p></p>').text(summary)); }
    if(items && items.length){ $card.append(makeMiniList('가이드', items)); }
    if(cautionItems && cautionItems.length){ $card.append(makeMiniList('주의', cautionItems)); }
    return $card;
  }

  function makeMiniList(title, items){
    var $wrap = $('<div class="mini-list-box"></div>');
    $wrap.append($('<strong></strong>').text(title));
    var $ul = $('<ul class="text-list"></ul>');
    $.each(items || [], function(_, item){ $ul.append($('<li></li>').text(item)); });
    $wrap.append($ul);
    return $wrap;
  }

  function modeBadge(guide){
    if(guide.displayMode === 'cdc_milestone'){ return '<span class="badge cdc">CDC 공식 체크포인트</span>'; }
    if(guide.displayMode === 'between_cdc_milestones'){ return '<span class="badge between">CDC 중간 관찰 월령</span>'; }
    return '<span class="badge between">첫 CDC 체크포인트 전</span>';
  }

  function renderHome(guide, babyAge, baby, krGuide){
    $('#homeBabyName').text((baby.name || '우리 아이') + '의 현재 월령');
    $('#homeTitle').text('생후 ' + babyAge.months + '개월 ' + babyAge.days + '일');
    $('#homeSub').text(babyAge.isOverMax ? '60개월 이후에는 마지막 가이드를 참고해요.' : '다음 개월까지 약 ' + babyAge.daysUntilNextMonth + '일 남았어요.');
    $('#daysUntilNextText').text(babyAge.isOverMax ? '60개월+' : babyAge.daysUntilNextMonth + '일');
    $('#guideMonthText').text(babyAge.guideMonth + '개월');
    $('#monthBadge').html('<span class="badge">가이드 기준 ' + babyAge.guideMonth + '개월</span>' + modeBadge(guide));
    renderAgeProgress(babyAge);
    $('#homeDirection').text(text(guide.direction || guide.summary));
    $('#homeCdcNotice').text(text(guide.cdcNotice));
    $('#homeFeeding').text(text(guide.feeding && guide.feeding.summary));
    $('#homeDisclaimer').text(text(guide.disclaimer));
    renderCompactChecklist($('#homeChecklist'), guide, babyAge.guideMonth);
    renderKoreaHome(krGuide);
  }

  function renderKoreaHome(krGuide){
    var $card = $('#krHomeCard');
    if(!$card.length){ return; }
    if(!krGuide){ $card.hide(); return; }
    $card.show();
    $('#krHomeStage').text(text(krGuide.feedingStageTitle));
    $('#krHomeSummary').text(text(krGuide.feedingSummary));
    renderList($('#krHomeGuideList'), safeItems(krGuide.feedingGuide).slice(0, 3));
    renderKoreaCheckups($('#krHomeCheckupList'), krGuide.koreaHealthCheckups || []);
  }

  function renderAgeProgress(babyAge){
    var total = babyAge.days + babyAge.daysUntilNextMonth;
    var percent = total > 0 ? Math.round((babyAge.days / total) * 100) : 0;
    var dash = 314 - (314 * percent / 100);
    $('#ageProgressValue').text(percent + '%');
    $('#ageProgressRing').css('stroke-dashoffset', dash);
  }

  function renderCompactChecklist($target, guide, month){
    $target.empty();
    var items = [];
    if(guide.checklist){
      $.each(['feeding','development','safety'], function(_, group){
        $.each(guide.checklist[group] || [], function(index, item){ if(items.length < 5){ items.push({group:group,index:index,text:item}); } });
      });
    }
    renderChecklistItems($target, items, month, true);
  }

  function renderGrowth(guide, krGuide, krKdstPolicy){
    $('#growthTitle').text(guide.title + ' 발달 포인트');
    $('#growthNotice').text(text(guide.cdcNotice));
    var $wrap = $('#growthGroups').empty();
    var dev = guide.development || {};
    $.each(['motor','language','social','cognitive'], function(_, key){ $wrap.append(makeListCard(labels[key], dev[key] || [])); });
    renderList($('#doctorCheckList'), guide.doctorCheck || []);
    renderKoreaGrowthPolicy(krGuide, krKdstPolicy);
  }

  function renderKoreaGrowthPolicy(krGuide, krKdstPolicy){
    var $target = $('#krGrowthPolicy');
    if(!$target.length){ return; }
    $target.empty();
    var message = krKdstPolicy && krKdstPolicy.appMessage ? krKdstPolicy.appMessage : (krGuide && krGuide.kdstNotice ? krGuide.kdstNotice : '국내 발달선별검사는 영유아 건강검진에서 확인할 수 있어요.');
    $target.append($('<p></p>').text(message));
    if(krGuide && krGuide.koreaHealthCheckups && krGuide.koreaHealthCheckups.length){ renderKoreaCheckups($target, krGuide.koreaHealthCheckups); }
  }

  function renderMeal(guide, foodWarning, month, krGuide, krFoodWarning){
    $('#mealTitle').text(guide.title + ' 식사 가이드');
    $('#mealSummary').text((guide.feeding && guide.feeding.stage ? guide.feeding.stage + ' · ' : '') + text(guide.feeding && guide.feeding.summary));
    var $wrap = $('#mealGroups').empty();
    var feeding = guide.feeding || {};
    $.each(['breastMilkFormula','cowMilk','meal','cupPractice','texture','caution'], function(_, key){ $wrap.append(makeListCard(labels[key], feeding[key] || [])); });
    renderFoodWarning(foodWarning, month);
    renderKoreaMeal(krGuide, krFoodWarning, month);
  }

  function renderKoreaMeal(krGuide, krFoodWarning, month){
    var $wrap = $('#krMealArea').empty();
    if(krGuide){
      $wrap.append(makeKoreaCard(krGuide.feedingStageTitle || '한국형 식사 가이드', krGuide.feedingSummary || '', krGuide.feedingGuide || [], krGuide.feedingCaution || []));
      if(krGuide.recommendedFrequency){ $wrap.append(makeInfoChip('권장 빈도', krGuide.recommendedFrequency)); }
      if(krGuide.approxComplementaryEnergyKcalPerDay){ $wrap.append(makeInfoChip('이유보충식 열량 참고', '하루 약 ' + krGuide.approxComplementaryEnergyKcalPerDay + 'kcal')); }
    }
    renderKoreaFoodWarning($('#krFoodWarningArea'), krFoodWarning, month);
  }

  function makeInfoChip(title, value){
    var $chip = $('<div class="kr-info-chip"></div>');
    $chip.append($('<span></span>').text(title));
    $chip.append($('<strong></strong>').text(value));
    return $chip;
  }

  function renderFoodWarning(foodWarning, month){
    var $area = $('#foodWarningArea').empty();
    if(!foodWarning){ $area.append('<p class="empty-text">음식 주의 데이터를 불러오지 못했습니다.</p>'); return; }
    if(month < 12){ appendFoodGroup($area, '12개월 전 피할 것', foodWarning.before12Months || []); }
    appendFoodGroup($area, '질식 위험 음식', foodWarning.chokingRisk || []);
    appendFoodGroup($area, '알레르기 가능 식품', foodWarning.allergens || []);
  }

  function renderKoreaFoodWarning($area, foodWarning, month){
    $area.empty();
    if(!foodWarning){ $area.append('<p class="empty-text">한국 음식 주의 데이터를 불러오지 못했습니다.</p>'); return; }
    if(month < 12){ appendFoodGroup($area, '한국 기준: 12개월 전 피할 것', foodWarning.before12Months || []); }
    appendFoodGroup($area, '한국 기준: 질식 위험 음식', foodWarning.chokingRisk || []);
    appendFoodGroup($area, '한국 기준: 알레르기 가능 식품', foodWarning.allergens || []);
    if(foodWarning.allergySymptoms && foodWarning.allergySymptoms.length){ appendPlainGroup($area, '알레르기 의심 증상', foodWarning.allergySymptoms); }
    if(foodWarning.doctorCheck && foodWarning.doctorCheck.length){ appendPlainGroup($area, '상담 권장 상황', foodWarning.doctorCheck); }
  }

  function appendFoodGroup($area, title, items){
    var $box = $('<div class="food-group"></div>');
    $box.append($('<h4></h4>').text(title));
    if(!items || !items.length){ $box.append('<p class="empty-text">항목이 없습니다.</p>'); }
    $.each(items || [], function(_, item){
      var $item = $('<div class="food-item"></div>');
      $item.append($('<strong></strong>').text(item.name || '항목'));
      $item.append($('<p></p>').text(item.reason || item.guide || '아이 상태에 맞게 주의해 주세요.'));
      $box.append($item);
    });
    $area.append($box);
  }

  function appendPlainGroup($area, title, items){
    var $box = $('<div class="food-group"></div>');
    $box.append($('<h4></h4>').text(title));
    var $ul = $('<ul class="text-list"></ul>');
    $.each(items || [], function(_, item){ $ul.append($('<li></li>').text(item)); });
    $box.append($ul);
    $area.append($box);
  }

  function renderPlay(guide){
    $('#playTitle').text(guide.title + ' 놀이');
    var $wrap = $('#playGroups').empty();
    var play = guide.play || {};
    $.each(['grossMotor','fineMotor','language','sensory','interaction'], function(_, key){ $wrap.append(makeListCard(labels[key], play[key] || [])); });
  }

  function renderChecklist(guide, month, krGuide){
    var $wrap = $('#checkGroups').empty();
    var checklist = guide.checklist || {};
    $.each(['development','feeding','sleep','safety'], function(_, group){
      var $card = $('<article class="card"></article>');
      $card.append($('<h3></h3>').text(labels[group]));
      var items = $.map(checklist[group] || [], function(item, index){ return {group:group,index:index,text:item}; });
      renderChecklistItems($card, items, month, false);
      $wrap.append($card);
    });
    renderKoreaChecklist(krGuide);
  }

  function renderKoreaChecklist(krGuide){
    var $target = $('#krCheckupArea').empty();
    if(!krGuide){ return; }
    var $card = $('<article class="card kr-card"></article>');
    $card.append('<p class="eyebrow">한국 공식자료 기준</p>');
    $card.append('<h3>건강검진·식사 체크</h3>');
    if(krGuide.koreaHealthCheckups && krGuide.koreaHealthCheckups.length){ renderKoreaCheckups($card, krGuide.koreaHealthCheckups); }
    if(krGuide.kdstNotice){ $card.append($('<p class="notice-text"></p>').text(krGuide.kdstNotice)); }
    if(krGuide.disclaimer){ $card.append($('<p class="muted small-text"></p>').text(krGuide.disclaimer)); }
    $target.append($card);
  }

  function renderChecklistItems($target, items, month, compact){
    if(!items || !items.length){ $target.append('<p class="empty-text">체크할 항목이 없습니다.</p>'); return; }
    var $list = $('<div class="checklist"></div>');
    $.each(items, function(_, item){
      var id = 'check_' + month + '_' + item.group + '_' + item.index + '_' + (compact ? 'home' : 'page');
      var checked = Storage.getChecklist(month, item.group, item.index);
      var $label = $('<label class="check-item"></label>');
      var $input = $('<input type="checkbox">').attr('id', id).data({month:month, group:item.group, index:item.index}).prop('checked', checked);
      $label.append($input).append($('<span></span>').text(item.text));
      $list.append($label);
    });
    $target.append($list);
  }

  function renderKoreaCheckups($target, checkups){
    if(!checkups || !checkups.length){
      $target.append('<p class="empty-text">현재 월령에 해당하는 한국 영유아 건강검진 보강 안내가 없습니다.</p>');
      return;
    }
    var $wrap = $('<div class="kr-checkup-list"></div>');
    $.each(checkups, function(_, item){
      var $box = $('<div class="kr-checkup-item"></div>');
      $box.append($('<strong></strong>').text((item.label || item.round + '차') + ' · ' + (item.ageRangeText || '')));
      $box.append($('<p></p>').text(item.message || item.appMessage || '영유아 건강검진 시기를 확인하세요.'));
      $wrap.append($box);
    });
    $target.append($wrap);
  }

  function renderSetting(baby, guide, validationText, krSources, krKdstPolicy){
    $('#settingBabyName').val(baby.name || '');
    $('#settingBabyBirthDate').val(baby.birthDate || '');
    $('#settingNotificationEnabled').prop('checked', !!baby.notificationEnabled);
    $('#settingDisclaimer').text((guide && guide.disclaimer) || '이 정보는 진단이나 치료 목적이 아니며, 걱정되는 부분이 있으면 소아청소년과에 상담하세요.');
    if(validationText){ $('#validationResult').text(validationText); }
    renderKoreaSources(krSources, krKdstPolicy);
  }

  function renderKoreaSources(krSources, krKdstPolicy){
    var $target = $('#krSourceList').empty();
    if(!krSources){ $target.append('<p class="empty-text">한국 공식자료 출처를 불러오지 못했습니다.</p>'); return; }
    var count = 0;
    $.each(krSources, function(_, source){
      if(count >= 6){ return false; }
      var $item = $('<li></li>');
      var label = source.name || '출처';
      if(source.url){ $item.append($('<a class="text-link" target="_blank" rel="noopener"></a>').attr('href', source.url).text(label)); }
      else { $item.text(label); }
      $target.append($item);
      count++;
    });
    if(krKdstPolicy && krKdstPolicy.appMessage){ $('#krKdstPolicyText').text(krKdstPolicy.appMessage); }
  }

  return {renderHome:renderHome,renderGrowth:renderGrowth,renderMeal:renderMeal,renderPlay:renderPlay,renderChecklist:renderChecklist,renderSetting:renderSetting};
})();
