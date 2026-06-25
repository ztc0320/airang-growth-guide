(function(window, document){
  function MiniQuery(input){
    if(typeof input === 'function'){
      if(document.readyState !== 'loading'){ input(); } else { document.addEventListener('DOMContentLoaded', input); }
      return new Wrapper([]);
    }
    if(input instanceof Wrapper){ return input; }
    var elements = [];
    if(typeof input === 'string'){
      var trimmed = input.trim();
      if(trimmed.charAt(0) === '<'){
        var template = document.createElement('template');
        template.innerHTML = trimmed;
        elements = Array.prototype.slice.call(template.content.childNodes);
      } else {
        elements = Array.prototype.slice.call(document.querySelectorAll(input));
      }
    } else if(input && (input.nodeType || input === window)){
      elements = [input];
    } else if(input && input.length){
      elements = Array.prototype.slice.call(input);
    }
    return new Wrapper(elements);
  }

  function Wrapper(elements){
    this.elements = elements || [];
    this.length = this.elements.length;
    for(var i = 0; i < this.elements.length; i++){ this[i] = this.elements[i]; }
  }

  Wrapper.prototype.each = function(callback){
    this.elements.forEach(function(el, index){ callback.call(el, index, el); });
    return this;
  };

  Wrapper.prototype.addClass = function(value){
    var classes = String(value || '').split(/\s+/);
    return this.each(function(){ this.classList.add.apply(this.classList, classes.filter(Boolean)); });
  };

  Wrapper.prototype.removeClass = function(value){
    if(value === undefined){ return this.each(function(){ this.className = ''; }); }
    var classes = String(value || '').split(/\s+/);
    return this.each(function(){ this.classList.remove.apply(this.classList, classes.filter(Boolean)); });
  };

  Wrapper.prototype.hasClass = function(value){
    return !!(this.elements[0] && this.elements[0].classList.contains(value));
  };

  Wrapper.prototype.text = function(value){
    if(value === undefined){ return this.elements[0] ? this.elements[0].textContent : ''; }
    return this.each(function(){ this.textContent = value == null ? '' : String(value); });
  };

  Wrapper.prototype.html = function(value){
    if(value === undefined){ return this.elements[0] ? this.elements[0].innerHTML : ''; }
    return this.each(function(){ this.innerHTML = value == null ? '' : String(value); });
  };

  Wrapper.prototype.empty = function(){
    return this.each(function(){ this.innerHTML = ''; });
  };

  Wrapper.prototype.append = function(content){
    return this.each(function(){
      appendTo(this, content);
    });
  };

  function appendTo(parent, content){
    if(content instanceof Wrapper){ content.each(function(){ parent.appendChild(this); }); return; }
    if(content && content.nodeType){ parent.appendChild(content); return; }
    if(typeof content === 'string'){
      var template = document.createElement('template');
      template.innerHTML = content;
      parent.appendChild(template.content.cloneNode(true));
      return;
    }
    if(content != null){ parent.appendChild(document.createTextNode(String(content))); }
  }

  Wrapper.prototype.val = function(value){
    if(value === undefined){ return this.elements[0] ? this.elements[0].value : ''; }
    return this.each(function(){ this.value = value == null ? '' : value; });
  };

  Wrapper.prototype.prop = function(name, value){
    if(value === undefined){ return this.elements[0] ? this.elements[0][name] : undefined; }
    return this.each(function(){ this[name] = value; });
  };

  Wrapper.prototype.attr = function(name, value){
    if(value === undefined){ return this.elements[0] ? this.elements[0].getAttribute(name) : undefined; }
    return this.each(function(){ this.setAttribute(name, value); });
  };

  Wrapper.prototype.removeAttr = function(name){
    return this.each(function(){ this.removeAttribute(name); });
  };

  Wrapper.prototype.data = function(name, value){
    if(typeof name === 'object'){
      return this.each(function(){ this.__miniData = this.__miniData || {}; for(var key in name){ this.__miniData[key] = name[key]; } });
    }
    if(value === undefined){
      var el = this.elements[0];
      if(!el){ return undefined; }
      if(el.__miniData && Object.prototype.hasOwnProperty.call(el.__miniData, name)){ return el.__miniData[name]; }
      var attr = el.getAttribute('data-' + String(name).replace(/[A-Z]/g, function(m){ return '-' + m.toLowerCase(); }));
      return attr;
    }
    return this.each(function(){ this.__miniData = this.__miniData || {}; this.__miniData[name] = value; });
  };

  Wrapper.prototype.on = function(eventName, selector, handler){
    if(typeof selector === 'function'){
      handler = selector;
      selector = null;
    }
    return this.each(function(){
      this.addEventListener(eventName, function(event){
        if(!selector){ handler.call(event.currentTarget, event); return; }
        var match = event.target.closest(selector);
        if(match && this.contains(match)){ handler.call(match, event); }
      });
    });
  };

  Wrapper.prototype.is = function(selector){
    var el = this.elements[0];
    if(!el){ return false; }
    if(selector === ':checked'){ return !!el.checked; }
    return el.matches(selector);
  };

  Wrapper.prototype.css = function(name, value){
    if(typeof name === 'object'){
      return this.each(function(){ for(var key in name){ this.style[key] = name[key]; } });
    }
    if(value === undefined){ return this.elements[0] ? getComputedStyle(this.elements[0])[name] : undefined; }
    return this.each(function(){ this.style[name] = value; });
  };

  Wrapper.prototype.remove = function(){
    return this.each(function(){ if(this.parentNode){ this.parentNode.removeChild(this); } });
  };


  Wrapper.prototype.show = function(){
    return this.each(function(){
      this.style.display = '';
      if(getComputedStyle(this).display === 'none'){
        this.style.display = this.__miniOldDisplay || 'block';
      }
    });
  };

  Wrapper.prototype.hide = function(){
    return this.each(function(){
      var currentDisplay = getComputedStyle(this).display;
      if(currentDisplay !== 'none'){
        this.__miniOldDisplay = currentDisplay;
      }
      this.style.display = 'none';
    });
  };

  Wrapper.prototype.toggle = function(force){
    return this.each(function(){
      var shouldShow = force;
      if(shouldShow === undefined){ shouldShow = getComputedStyle(this).display === 'none'; }
      if(shouldShow){
        this.style.display = '';
        if(getComputedStyle(this).display === 'none'){
          this.style.display = this.__miniOldDisplay || 'block';
        }
      } else {
        var currentDisplay = getComputedStyle(this).display;
        if(currentDisplay !== 'none'){
          this.__miniOldDisplay = currentDisplay;
        }
        this.style.display = 'none';
      }
    });
  };

  MiniQuery.each = function(obj, callback){
    if(Array.isArray(obj) || (obj && typeof obj.length === 'number')){
      for(var i = 0; i < obj.length; i++){ if(callback.call(obj[i], i, obj[i]) === false){ break; } }
    } else {
      for(var key in obj){ if(callback.call(obj[key], key, obj[key]) === false){ break; } }
    }
  };

  MiniQuery.map = function(arr, callback){
    var result = [];
    MiniQuery.each(arr || [], function(index, value){
      var mapped = callback(value, index);
      if(mapped != null){ result.push(mapped); }
    });
    return result;
  };

  MiniQuery.trim = function(value){ return String(value == null ? '' : value).trim(); };


  MiniQuery.inArray = function(value, array){
    return (array || []).indexOf(value);
  };

  MiniQuery.Deferred = function(){
    var resolveFn, rejectFn;
    var promise = new Promise(function(resolve, reject){ resolveFn = resolve; rejectFn = reject; });
    var api = deferred(promise);
    api.resolve = function(value){ resolveFn(value); return api; };
    api.reject = function(error){ rejectFn(error); return api; };
    api.promise = function(){ return api; };
    return api;
  };

  function deferred(promise){
    var api = {};
    api.done = function(fn){ promise.then(function(value){ if(Array.isArray(value) && value.__whenResult){ fn.apply(null, value); } else { fn(value); } }); return api; };
    api.fail = function(fn){ promise.catch(fn); return api; };
    api.then = function(fn){ var next = promise.then(fn); return deferred(next); };
    api.catch = function(fn){ var next = promise.catch(fn); return deferred(next); };
    api.finally = function(fn){ var next = promise.finally(fn); return deferred(next); };
    return api;
  }

  MiniQuery.getJSON = function(url){
    var p = fetch(url).then(function(response){
      if(!response.ok){ throw new Error('HTTP ' + response.status + ' ' + url); }
      return response.json();
    }).then(function(data){ return [data, 'success', null]; });
    return deferred(p);
  };

  MiniQuery.when = function(){
    var args = Array.prototype.slice.call(arguments);
    var promises = args.map(function(item){
      return new Promise(function(resolve, reject){ item.done(resolve).fail(reject); });
    });
    var p = Promise.all(promises).then(function(results){ results.__whenResult = true; return results; });
    return deferred(p);
  };

  window.$ = window.jQuery = MiniQuery;
})(window, document);
