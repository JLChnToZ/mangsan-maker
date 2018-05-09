((window, document, history, location) => {
  const supportsHistoryState = typeof history.pushState === 'function';
  const text = ((src, placeHolder) => {
    const raw = src.length > 1 && src.substr(1);
    return !raw ? placeHolder :
      raw.indexOf('&') >= 0 ?
      raw.split('&').map(decodeURIComponent) :
      decodeURIComponent(raw);
  })(location.search, '萌新');
  const { getIndex, joinStr, title } = (src => typeof src === 'string' ? {
    getIndex: String.prototype.charAt,
    joinStr: '',
    title: src
  } : {
    getIndex(index) { return this[index]; },
    joinStr: ' ',
    title: src.join(' ')
  })(text);
  document.title = `${title} Maker`;
  const base = text.length;
  const maxLength = Math.floor(Math.log(Number.MAX_SAFE_INTEGER + 1) / Math.log(base));
  
  const trianglify = (() => {
    if(!window.Trianglify)
      return function(seed) {};
    let trianglify, timer, lastSeed = null, blobUrl, firstRun;
    function run(seed) {
      if(timer) timer = undefined;
      if(!seed) seed = lastSeed;
      else lastSeed = seed;
      const opts = {
        width: window.innerWidth,
        height: window.innerHeight,
        seed
      };
      trianglify = trianglify ?
        Trianglify(Object.assign(trianglify.opts, opts)) : Trianglify(opts);

      if(blobUrl) URL.revokeObjectURL(blobUrl);
      const svg = trianglify.svg({ includeNamespace: true });
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      blobUrl = URL.createObjectURL(new Blob(
        [svg.outerHTML], { type: 'image/svg+xml' }
      ));
      document.body.style.backgroundImage = `url(${blobUrl})`;
    }
    return function(seed) {
      if(timer)
        clearTimeout(timer);
      if(!firstRun || (seed && lastSeed !== seed))
        run(seed);
      else
        timer = setTimeout(run, 200, seed);
      firstRun = true;
    };
  })();

  const element = document.createElement('h1');
  element.id = 'name';
  element.tabIndex = 0;
  document.body.appendChild(element);

  window.addEventListener('hashchange', parseHash);
  window.addEventListener('popstate', ({ state }) => {
    if(state) parse(state);
  });
  window.addEventListener('resize', e => void trianglify());

  element.addEventListener('click', e => void generate());
  element.addEventListener('keypress', e => {
    if(e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    generate();
  });

  if(!parseHash()) generate(1);

  function parseHash() {
    const { hash } = location;
    if(typeof hash !== 'string') return;
    const matches = hash.match(/^#([A-Z0-9]{1,2})-([A-Z0-9]{1,11})$/i);
    if(!matches) return;
    const state = {
      l: parseInt(matches[1], 36),
      v: parseInt(matches[2], 36),
    };
    if(supportsHistoryState)
      history.replaceState(state, parse(state), hash);
    return 1;
  }

  function parse({ l: length, v: value }) {
    if(!Number.isSafeInteger(length) || !Number.isSafeInteger(value)) return;
    value = value.toString(base);
    value = length > value.length ?
      '0'.repeat(length - value.length) + value :
      value.substr(-length);
    trianglify(`${length}/${value}`);
    return element.textContent = value.split('').map(getIndex, text).join(joinStr);
  }

  function generate(replace) {
    const l = Math.floor(Math.random() * maxLength + 1);
    const v = Math.floor(Math.random() * (Math.pow(base, l) - 1));
    const state = { l, v };
    const parsedState = parse(state);
    const hash = `#${l.toString(36)}-${v.toString(36)}`;
    if(supportsHistoryState)
      history[replace ? 'replaceState' : 'pushState'](
        state, parsedState, hash
      );
    else
      location.hash = hash;
  }
})(window, document, history, location);