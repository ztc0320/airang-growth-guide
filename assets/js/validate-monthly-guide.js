function validateMonthlyGuide(data){
  var errors = [];
  var requiredKeys = [];
  var cdcMilestones = [2,4,6,9,12,15,18,24,30,36,48,60];
  for(var i = 0; i <= 60; i++){ requiredKeys.push(String(i)); }
  if(!data || typeof data !== 'object'){ return {valid:false, errors:['monthly-guide.json 데이터가 객체가 아닙니다.']}; }
  var keys = Object.keys(data);
  if(keys.length !== 61){ errors.push('전체 key 개수가 61개가 아닙니다. 현재: ' + keys.length); }
  $.each(requiredKeys, function(_, key){
    if(!data[key]){ errors.push('누락된 월령 key: ' + key); }
  });
  $.each(requiredKeys, function(_, key){
    var item = data[key];
    if(!item){ return; }
    var month = Number(key);
    if(item.month !== month){ errors.push(key + ': month 값이 key와 다릅니다.'); }
    if(!item.development){ errors.push(key + ': development 필드 누락'); }
    if(!item.feeding){ errors.push(key + ': feeding 필드 누락'); }
    if(!item.checklist){ errors.push(key + ': checklist 필드 누락'); }
    if(!item.disclaimer){ errors.push(key + ': disclaimer 필드 누락'); }
    if(!item.sources || !item.sources.length){ errors.push(key + ': sources 필드 누락'); }
    if(month === 0 || month === 1){
      if(item.displayMode !== 'before_first_cdc_milestone'){ errors.push(key + ': displayMode는 before_first_cdc_milestone이어야 합니다.'); }
    }else if($.inArray(month, cdcMilestones) > -1){
      if(item.displayMode !== 'cdc_milestone'){ errors.push(key + ': CDC 공식 체크포인트 displayMode 오류'); }
      if(!item.sourceAgeMonths || item.sourceAgeMonths.indexOf(month) === -1){ errors.push(key + ': sourceAgeMonths에 자기 월령이 없습니다.'); }
    }else{
      if(item.displayMode !== 'between_cdc_milestones'){ errors.push(key + ': 중간 월령 displayMode 오류'); }
      if(item.previousCdcMilestone === null || item.nextCdcMilestone === null){ errors.push(key + ': previousCdcMilestone 또는 nextCdcMilestone 누락'); }
    }
  });
  if(errors.length){ console.warn('[monthly-guide validation]', errors); }
  return {valid: errors.length === 0, errors: errors, checkedAt: new Date().toISOString()};
}