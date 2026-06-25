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

  function text(value){
    return value || '';
  }

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

  function modeBadge(guide){
    if(guide.displayMode === 'cdc_milestone'){ return '<span class="badge cdc">CDC 공식 체크포인트</span>'; }
    if(guide.displayMode === 'between_cdc_milestones'){ return '<span class="badge between">CDC 중간 관찰 월령</span>'; }
    return '<span class="badge between">첫 CDC 체크포인트 전</span>';
  }

  function renderHome(guide, babyAge, baby){
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
        $.each(guide.checklist[group] || [], function(index, item){
          if(items.length < 5){ items.push({group:group,index:index,text:item}); }
        });
      });
    }
    renderChecklistItems($target, items, month, true);
  }

  function renderGrowth(guide){
    $('#growthTitle').text(guide.title + ' 발달 포인트');
    $('#growthNotice').text(text(guide.cdcNotice));
    var $wrap = $('#growthGroups').empty();
    var dev = guide.development || {};
    $.each(['motor','language','social','cognitive'], function(_, key){ $wrap.append(makeListCard(labels[key], dev[key] || [])); });
    renderList($('#doctorCheckList'), guide.doctorCheck || []);
  }

  function renderMeal(guide, foodWarning, month){
    $('#mealTitle').text(guide.title + ' 식사 가이드');
    $('#mealSummary').text((guide.feeding && guide.feeding.stage ? guide.feeding.stage + ' · ' : '') + text(guide.feeding && guide.feeding.summary));
    var $wrap = $('#mealGroups').empty();
    var feeding = guide.feeding || {};
    $.each(['breastMilkFormula','cowMilk','meal','cupPractice','texture','caution'], function(_, key){ $wrap.append(makeListCard(labels[key], feeding[key] || [])); });
    renderFoodWarning(foodWarning, month);
  }

  function renderFoodWarning(foodWarning, month){
    var $area = $('#foodWarningArea').empty();
    if(!foodWarning){ $area.append('<p class="empty-text">음식 주의 데이터를 불러오지 못했습니다.</p>'); return; }
    if(month < 12){ appendFoodGroup($area, '12개월 전 피할 것', foodWarning.before12Months || []); }
    appendFoodGroup($area, '질식 위험 음식', foodWarning.chokingRisk || []);
    appendFoodGroup($area, '알레르기 가능 식품', foodWarning.allergens || []);
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

  function renderPlay(guide){
    $('#playTitle').text(guide.title + ' 놀이');
    var $wrap = $('#playGroups').empty();
    var play = guide.play || {};
    $.each(['grossMotor','fineMotor','language','sensory','interaction'], function(_, key){ $wrap.append(makeListCard(labels[key], play[key] || [])); });
  }

  function renderChecklist(guide, month){
    var $wrap = $('#checkGroups').empty();
    var checklist = guide.checklist || {};
    $.each(['development','feeding','sleep','safety'], function(_, group){
      var $card = $('<article class="card"></article>');
      $card.append($('<h3></h3>').text(labels[group]));
      var items = $.map(checklist[group] || [], function(item, index){ return {group:group,index:index,text:item}; });
      renderChecklistItems($card, items, month, false);
      $wrap.append($card);
    });
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

  function renderSetting(baby, guide, validationText){
    $('#settingBabyName').val(baby.name || '');
    $('#settingBabyBirthDate').val(baby.birthDate || '');
    $('#settingNotificationEnabled').prop('checked', !!baby.notificationEnabled);
    $('#settingDisclaimer').text((guide && guide.disclaimer) || '이 정보는 진단이나 치료 목적이 아니며, 걱정되는 부분이 있으면 소아청소년과에 상담하세요.');
    if(validationText){ $('#validationResult').text(validationText); }
  }

  return {renderHome:renderHome,renderGrowth:renderGrowth,renderMeal:renderMeal,renderPlay:renderPlay,renderChecklist:renderChecklist,renderSetting:renderSetting};
})();
