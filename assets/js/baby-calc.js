var BabyCalc = (function(){
  function parseDate(value){
    if(!value){ return null; }
    var parts = value.split('-');
    if(parts.length !== 3){ return null; }
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function startOfDay(date){
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function daysInMonth(year, monthIndex){
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function addMonths(date, count){
    var year = date.getFullYear();
    var month = date.getMonth() + count;
    var day = date.getDate();
    var target = new Date(year, month, 1);
    var lastDay = daysInMonth(target.getFullYear(), target.getMonth());
    target.setDate(Math.min(day, lastDay));
    return target;
  }

  function diffDays(a, b){
    var ms = startOfDay(a).getTime() - startOfDay(b).getTime();
    return Math.floor(ms / 86400000);
  }

  function getBabyAge(birthDateValue, todayValue){
    var birth = parseDate(birthDateValue);
    var today = todayValue ? startOfDay(todayValue) : startOfDay(new Date());
    if(!birth || isNaN(birth.getTime())){ return null; }
    if(today < birth){ return {months:0,days:0,guideMonth:0,daysUntilNextMonth:0,nextMonth:1,isOverMax:false}; }
    var months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if(today < addMonths(birth, months)){ months--; }
    months = Math.max(months, 0);
    var monthStart = addMonths(birth, months);
    var nextMonthDate = addMonths(birth, months + 1);
    var days = Math.max(diffDays(today, monthStart), 0);
    var daysUntilNextMonth = Math.max(diffDays(nextMonthDate, today), 0);
    return {months:months,days:days,guideMonth:clampGuideMonth(months),daysUntilNextMonth:daysUntilNextMonth,nextMonth:months + 1,isOverMax:months > 60};
  }

  function clampGuideMonth(month){
    if(month < 0){ return 0; }
    if(month > 60){ return 60; }
    return month;
  }

  return {parseDate:parseDate,addMonths:addMonths,getBabyAge:getBabyAge,clampGuideMonth:clampGuideMonth};
})();
