/**
 * beehiiv Embed Controller — V3
 *
 * Publisher-side script that manages V3 subscribe forms.
 * Fetches config from /api/v3/forms/:id, manages triggers, builds render
 * chrome (modal/slide-in/bar/full-page), creates iframes, handles frequency
 * capping via cookies, and absorbs attribution.js UTM/referrer logic.
 *
 * Each form gets its own BeehiivEmbed instance which owns its iframe,
 * listeners, DOM nodes, and cleanup. This supports multiple forms per page
 * and SPA contexts with proper destroy() lifecycle.
 *
 * Usage:
 *   <script src="https://subscribe-forms.beehiiv.com/v3/loader.js"
 *     data-beehiiv-form="<form-uuid-or-stub-id>">
 *   </script>
 */
(function () {
  'use strict';

  var API_BASE = (function () {
    var s = document.currentScript;
    if (!s || !s.src) return '';
    var url = new URL(s.src);
    return url.origin;
  })();

  // ─── Attribution tracker (absorbed from attribution.js) ──────────────────

  var Attribution = {
    cookieName: 'bhv_attribution',
    cookieExpiry: 30,

    parseParameters: function () {
      var parsed = {};
      var urlParams;
      try { urlParams = new URL(document.location).searchParams; } catch (e) { return parsed; }
      if (!urlParams) return parsed;

      var utmParams = ['source', 'medium', 'campaign', 'term', 'content'];
      for (var i = 0; i < utmParams.length; i++) {
        var val = urlParams.get('utm_' + utmParams[i]);
        if (val) parsed[utmParams[i]] = val;
      }

      if (!urlParams.has('utm_source') && !urlParams.has('utm_medium')) {
        var cpc = {
          google: ['gclid', 'gclsrc', 'dclid', 'wbraid', 'gbraid', 'gad_source'],
          facebook: 'fbclid', bing: 'msclkid', linkedin: 'li_fat_id',
          tiktok: 'ttclid', twitter: 'twclid'
        };
        for (var source in cpc) {
          if (!cpc.hasOwnProperty(source)) continue;
          var ids = Array.isArray(cpc[source]) ? cpc[source] : [cpc[source]];
          for (var j = 0; j < ids.length; j++) {
            if (urlParams.has(ids[j])) {
              parsed.source = source;
              parsed.medium = 'cpc';
              return parsed;
            }
          }
        }
      }
      return parsed;
    },

    parseReferrer: function () {
      if (!document.referrer) return {};
      try {
        var ref = new URL(document.referrer);
        if (ref.hostname === window.location.hostname) return {};

        var rules = {
          organic: {
            google: /^www\.(google)\.[a-z]{2,3}(?:\.[a-z]{2})?$/,
            bing: /^www\.(bing)\.com$/,
            duckduckgo: /^(duckduckgo)\.com$/,
            yahoo: /^(?:www|m)?\\.?(yahoo)\.(?:com|cn)$/,
            ecosia: /^www\.(ecosia)\.org$/
          },
          social: {
            linkedin: /^www\.(linkedin)\.com$/,
            facebook: /^www\.(facebook)\.com$/,
            twitter: /^t\.co$/,
            instagram: /^l\.(instagram)\.com$/,
            pinterest: /^www\.(pinterest)\.com$/,
            youtube: /^www\.(youtube)\.com$/
          }
        };

        for (var medium in rules) {
          if (!rules.hasOwnProperty(medium)) continue;
          for (var src in rules[medium]) {
            if (!rules[medium].hasOwnProperty(src)) continue;
            if (rules[medium][src].test(ref.hostname)) {
              return { source: src, medium: medium };
            }
          }
        }
        return { source: ref.hostname, medium: 'referral' };
      } catch (e) {
        return {};
      }
    },

    getCookie: function (name) {
      var v = '; ' + document.cookie;
      var parts = v.split('; ' + name + '=');
      if (parts.length === 2) {
        try { return JSON.parse(decodeURIComponent(parts.pop().split(';').shift())); }
        catch (e) { return null; }
      }
      return null;
    },

    setCookie: function (name, value, days) {
      var d = new Date();
      d.setTime(d.getTime() + (days * 86400000));
      document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + '; expires=' + d.toUTCString() + '; path=/';
    },

    getData: function () {
      var params = this.parseParameters();
      var referrer = Object.keys(params).length === 0 ? this.parseReferrer() : {};
      var existing = this.getCookie(this.cookieName) || {};

      if (Object.keys(params).length === 0 && Object.keys(referrer).length === 0) return existing;

      var data = {};
      var sources = [existing, referrer, params, { last_updated: new Date().toISOString(), referrer: document.referrer, landing_page: window.location.href }];
      for (var s = 0; s < sources.length; s++) {
        for (var k in sources[s]) {
          if (sources[s].hasOwnProperty(k)) data[k] = sources[s][k];
        }
      }
      this.setCookie(this.cookieName, data, this.cookieExpiry);
      return data;
    }
  };

  // ─── Cookie-based frequency capping ──────────────────────────────────────

  function isDismissed(formId, capDays) {
    if (!capDays || capDays <= 0) return false;
    var cookie = Attribution.getCookie('bhv_' + formId + '_dismissed');
    if (!cookie) return false;
    var elapsed = (Date.now() - cookie) / 86400000;
    return elapsed < capDays;
  }

  function markDismissed(formId) {
    var d = new Date();
    d.setTime(d.getTime() + (365 * 86400000));
    document.cookie = 'bhv_' + formId + '_dismissed=' + encodeURIComponent(Date.now().toString()) + '; expires=' + d.toUTCString() + '; path=/';
  }

  // ─── Embed registry ─────────────────────────────────────────────────────

  var registry = window.__bhv_embeds || (window.__bhv_embeds = {});

  // ─── Shared resize observer ─────────────────────────────────────────────

  var currentWindowWidth = window.outerWidth;

  if (!window.__bhv_resizeObserver) {
    window.__bhv_resizeObserver = new ResizeObserver(function () {
      // Only re-measure inline forms when the viewport width changes
      if (window.outerWidth === currentWindowWidth) return;

      for (var id in registry) {
        if (!registry.hasOwnProperty(id)) continue;
        var embed = registry[id];
        if (!embed.iframe) continue;
        if (embed.form.render_type !== 'inline') continue; // overlays size once on load
        (function (iframe) {
          requestAnimationFrame(function () {
            iframe.removeAttribute('data-bhv-sized');
            iframe.style.height = '2000px';
            iframe.contentWindow.postMessage({ type: 'beehiiv:resize' }, '*');
          });
        })(embed.iframe);
      }

      currentWindowWidth = window.outerWidth;
    });
    window.__bhv_resizeObserver.observe(document.querySelector('body'));
  }

  // ─── BeehiivEmbed class ─────────────────────────────────────────────────

  function BeehiivEmbed(script) {
    this.script = script;
    this.formId = script.getAttribute('data-beehiiv-form');
    this.isPreview = script.getAttribute('data-beehiiv-preview') === 'true';
    this.form = null;
    this.iframe = null;
    this.wrapper = null;
    this.chrome = null; // overlay, panel, or bar element
    this.listeners = [];
    this.triggerCleanup = null;
  }

  BeehiivEmbed.prototype.init = function () {
    if (!this.formId) return;

    var self = this;
    this._fetchConfig(function (config) {
      var form = config.form;
      if (!form) {
        console.warn('[beehiiv] No form data in config for: ' + self.formId);
        return;
      }

      form._preview = self.isPreview;
      self.form = form;

      if (!self.isPreview && isDismissed(form.id, form.frequency_cap_days)) return;

      registry[self.formId] = self;
      self._setupTrigger();
    });
  };

  BeehiivEmbed.prototype.destroy = function () {
    // Remove all registered event listeners
    for (var i = 0; i < this.listeners.length; i++) {
      var l = this.listeners[i];
      l.target.removeEventListener(l.event, l.handler, l.options);
    }
    this.listeners = [];

    // Run trigger-specific cleanup (scroll listener, observer, etc.)
    if (this.triggerCleanup) {
      this.triggerCleanup();
      this.triggerCleanup = null;
    }

    // Remove DOM nodes
    if (this.chrome) {
      this.chrome.remove();
      this.chrome = null;
    }
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.remove();
      this.wrapper = null;
    }

    // Restore body padding if sticky bar
    if (this.form) {
      var rt = this.form.render_type;
      if (rt === 'sticky_top') document.body.style.paddingTop = '';
      if (rt === 'sticky_bottom') document.body.style.paddingBottom = '';
    }

    this.iframe = null;
    delete registry[this.formId];
  };

  // ─── Config fetching ────────────────────────────────────────────────────

  BeehiivEmbed.prototype._fetchConfig = function (callback) {
    var url = API_BASE + '/api/v3/forms/' + this.formId;
    if (this.isPreview) url += '?preview=true';
    var self = this;

    fetch(url)
      .then(function (response) {
        if (!response.ok) {
          console.warn('[beehiiv] Config fetch failed (' + response.status + ') for: ' + self.formId);
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (data) callback(data);
      })
      .catch(function (err) {
        console.warn('[beehiiv] Config fetch error for: ' + self.formId, err.message);
      });
  };

  // ─── Event listener management ──────────────────────────────────────────

  BeehiivEmbed.prototype._on = function (target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.listeners.push({ target: target, event: event, handler: handler, options: options });
  };

  // ─── Trigger engine ─────────────────────────────────────────────────────

  BeehiivEmbed.prototype._setupTrigger = function () {
    var self = this;
    var t = this.form.trigger_type;
    var tc = this.form.trigger_config || {};

    if (t === 'direct') {
      this._render();

    } else if (t === 'timer') {
      var delay = (tc.delay_seconds || 5) * 1000;
      var timerId = setTimeout(function () { self._render(); }, delay);
      this.triggerCleanup = function () { clearTimeout(timerId); };

    } else if (t === 'scroll_depth') {
      var pct = tc.percentage || 50;
      var fired = false;
      var onScroll = function () {
        if (fired) return;
        var scrollable = document.documentElement.scrollHeight - window.innerHeight;
        var scrolled = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
        if (scrolled >= pct) {
          fired = true;
          self._render();
        }
      };
      this._on(window, 'scroll', onScroll, { passive: true });
      this.triggerCleanup = function () { fired = true; };

    } else if (t === 'element_visible') {
      var sel = tc.selector;
      var el = sel ? document.querySelector(sel) : null;
      if (!el) {
        console.warn('[beehiiv] element_visible trigger: selector not found: ' + sel);
        return;
      }
      var obs = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            obs.disconnect();
            self._render();
          }
        }
      }, { threshold: 0.5 });
      obs.observe(el);
      this.triggerCleanup = function () { obs.disconnect(); };

    } else if (t === 'dom_event') {
      var evtSel = tc.selector;
      var evt = tc.event || 'click';
      var els = evtSel ? document.querySelectorAll(evtSel) : [];
      for (var i = 0; i < els.length; i++) {
        (function (el) {
          var handler = function () {
            el.removeEventListener(evt, handler);
            self._render();
          };
          self._on(el, evt, handler, false);
        })(els[i]);
      }

    } else if (t === 'exit_intent') {
      var exitFired = false;
      var onMouseLeave = function (e) {
        if (exitFired || e.clientY > 0) return;
        exitFired = true;
        self._render();
      };
      this._on(document, 'mouseleave', onMouseLeave);

      if (window.matchMedia('(pointer: coarse)').matches) {
        var fallback = (tc.mobile_fallback_delay_seconds || 10) * 1000;
        var fallbackId = setTimeout(function () {
          if (!exitFired) {
            exitFired = true;
            self._render();
          }
        }, fallback);
        this.triggerCleanup = function () {
          exitFired = true;
          clearTimeout(fallbackId);
        };
      } else {
        this.triggerCleanup = function () { exitFired = true; };
      }
    }
  };

  // ─── Render dispatch ────────────────────────────────────────────────────

  BeehiivEmbed.prototype._render = function () {
    injectGlobalStyles();
    var iframeSrc = this._buildIframeSrc();

    switch (this.form.render_type) {
      case 'inline':         return this._renderInline(iframeSrc);
      case 'popup':          return this._renderPopup(iframeSrc);
      case 'slide_in_left':  return this._renderSlideIn(iframeSrc, 'left');
      case 'slide_in_right': return this._renderSlideIn(iframeSrc, 'right');
      case 'sticky_top':     return this._renderStickyBar(iframeSrc, 'top');
      case 'sticky_bottom':  return this._renderStickyBar(iframeSrc, 'bottom');
    }
  };

  BeehiivEmbed.prototype._buildIframeSrc = function () {
    var form = this.form;
    var url = new URL(form.url);

    if (form._preview) {
      url.searchParams.set('preview', 'true');
    }

    var layout = form.layout || 'regular';

    if (layout !== 'regular') {
      url.searchParams.set('layout', layout);
    }

    var attr = Attribution.getData();
    if (attr.source) url.searchParams.set('utm_source', attr.source);
    if (attr.medium) url.searchParams.set('utm_medium', attr.medium);
    if (attr.campaign) url.searchParams.set('utm_campaign', attr.campaign);
    url.searchParams.set('referrer', encodeURIComponent(window.location.href));

    return url.href;
  };

  // ─── Iframe factory ─────────────────────────────────────────────────────

  BeehiivEmbed.prototype._createIframe = function (src, initialHeight, options) {
    var self = this;
    var opts = options || {};
    var collapsed = opts.collapsed || false;
    var onReady = opts.onReady || null;
    var onResize = opts.onResize || null;

    var wrapper = document.createElement('div');
    if (collapsed) {
      wrapper.style.cssText = 'overflow:hidden;height:0;';
    }

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.style.cssText = 'width:100%;height:' + (initialHeight || 320) + 'px;border:none;display:block;';

    wrapper.appendChild(iframe);
    this.iframe = iframe;
    this.wrapper = wrapper;

    var revealed = !collapsed;

    // Fallback: if child never loads (server-side 403 block page), expand
    // the iframe so the HUMAN challenge is usable.
    var challengeFallback = setTimeout(function () {
      if (!revealed) {
        revealed = true;
        wrapper.style.height = '';
        wrapper.style.overflow = '';
        iframe.style.height = '350px';
        iframe.style.width = '100%';
      }
    }, 5000);

    this._on(window, 'message', function (e) {
      if (e.source !== iframe.contentWindow) return;
      if (e.origin !== API_BASE) return;
      var msg = e.data;

      if (msg.type === 'beehiiv:styles') {
        if (!collapsed && iframe.getAttribute('data-bhv-sized')) return;
        requestAnimationFrame(function () {
          if (!revealed) {
            revealed = true;
            wrapper.style.height = '';
            wrapper.style.overflow = '';
          }
          if (msg.payload && msg.payload.height) iframe.style.height = msg.payload.height;
          if (msg.payload && msg.payload.width && !collapsed) iframe.style.width = msg.payload.width;
          if (msg.payload && msg.payload.borderRadius) iframe.style.borderRadius = msg.payload.borderRadius;
          if (msg.payload && msg.payload.boxShadow) iframe.style.boxShadow = msg.payload.boxShadow;
          iframe.setAttribute('data-bhv-sized', 'true');
          if (onReady) { onReady(); onReady = null; }
          if (onResize) onResize();
        });
      } else if (msg.type === 'beehiiv:child-loaded') {
        clearTimeout(challengeFallback);
        iframe.style.height = '2000px';
        if (collapsed) {
          // Inline: use 100% width so the form adapts to its container
          iframe.style.width = '100%';
        } else {
          // Overlays: measure unconstrained, then re-measure at actual width in onReady
          iframe.style.width = '5000px';
        }
        requestAnimationFrame(function () {
          iframe.contentWindow.postMessage({ type: 'beehiiv:parent-loaded' }, '*');
        });
      } else if (msg.type === 'beehiiv:challenge') {
        // HUMAN challenge detected inside iframe — resize to fit
        requestAnimationFrame(function () {
          if (msg.payload && msg.payload.height) iframe.style.height = msg.payload.height;
          if (msg.payload && msg.payload.width) iframe.style.width = msg.payload.width;
        });
      } else if (msg.type === 'beehiiv:challenge-resolved') {
        // Challenge solved — remeasure the form
        iframe.removeAttribute('data-bhv-sized');
        iframe.style.height = '2000px';
        iframe.contentWindow.postMessage({ type: 'beehiiv:resize' }, '*');
      } else if (msg.type === 'beehiiv:success-toast') {
        // Dismiss overlays after successful submission, then show toast
        var rt = self.form && self.form.render_type;
        if (rt !== 'inline') {
          self.destroy();
        }
        showToast(msg.payload);
      } else if (msg.type === 'beehiiv:redirect' && msg.url) {
        window.location.href = msg.url;
      } else if (msg.type === 'beehiiv:submitted') {
        // form submitted — could fire analytics events here
      }
    });

    return wrapper;
  };

  function showToast(payload) {
    if (!payload || !payload.templateString) return;
    try {
      var doc = (new DOMParser()).parseFromString(payload.templateString, 'text/html');
      var frag = document.createDocumentFragment();
      var nodes = doc.body.childNodes;
      for (var i = 0; i < nodes.length; i++) {
        frag.appendChild(nodes[i].cloneNode(true));
      }
      var toast = frag.querySelector('#beehiiv-toast');
      if (toast) toast.style.zIndex = '2147483647';
      document.body.appendChild(frag);
      setTimeout(function () {
        var el = document.querySelector('#beehiiv-toast');
        if (el) el.remove();
      }, 5000);
    } catch (e) {
      // noop
    }
  }

  // ─── Render: Inline ─────────────────────────────────────────────────────

  BeehiivEmbed.prototype._renderInline = function (iframeSrc) {
    var wrap = makeEl('div', 'width:100%;max-width:100%;margin:0 auto;');
    var iframeWrap = this._createIframe(iframeSrc, window.document.body.offsetWidth, { collapsed: true });
    wrap.appendChild(iframeWrap);
    this.script.parentNode.insertBefore(wrap, this.script.nextSibling);
    this.chrome = wrap;
  };

  // ─── Render: Popup ──────────────────────────────────────────────────────

  BeehiivEmbed.prototype._renderPopup = function (iframeSrc) {
    var self = this;
    var isTransparent = this.form.container_background_transparent;
    var bgColor = this.form.container_background_color || '#fff';
    var borderRadius = this.form.container_border_radius || '16px';

    var overlay = makeEl('div',
      'position:fixed;inset:0;background:rgba(0,0,0,0.55);' +
      'display:flex;align-items:center;justify-content:center;' +
      'z-index:2147483647;opacity:0;'
    );

    var modal = makeEl('div',
      'position:relative;max-width:calc(100vw - 48px);overflow:hidden;' +
      (isTransparent
        ? 'background:transparent;'
        : 'background:' + bgColor + ';border-radius:' + borderRadius + ';box-shadow:0 24px 64px rgba(0,0,0,0.25);')
    );

    var closeBtn = makeCloseButton(function () {
      self._dismiss();
    }, null, this.form.container_close_icon_color);

    var iframeWrap = this._createIframe(iframeSrc, 360, { onReady: function () {
      overlay.style.opacity = '';
      overlay.style.animation = 'bhv-fade-in 0.25s ease';
      modal.style.animation = 'bhv-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1)';
      remeasureAtWidth(self, modal.offsetWidth);
    }});
    modal.appendChild(closeBtn);
    modal.appendChild(iframeWrap);

    this._on(overlay, 'click', function (e) {
      if (e.target === overlay) self._dismiss();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.chrome = overlay;
  };

  // ─── Render: Slide-in ───────────────────────────────────────────────────

  BeehiivEmbed.prototype._renderSlideIn = function (iframeSrc, side) {
    var self = this;
    var isRight = side === 'right';
    var animName = isRight ? 'bhv-slide-from-right' : 'bhv-slide-from-left';

    var isTransparent = this.form.container_background_transparent;
    var bgColor = this.form.container_background_color || '#fff';
    var borderRadius = this.form.container_border_radius || '16px';
    var panel = makeEl('div',
      'position:fixed;bottom:24px;' + (isRight ? 'right:24px;' : 'left:24px;') +
      'max-width:calc(100vw - 48px);overflow:hidden;' +
      'z-index:2147483647;opacity:0;' +
      (isTransparent
        ? 'background:transparent;'
        : 'background:' + bgColor + ';border-radius:' + borderRadius + ';box-shadow:0 8px 40px rgba(0,0,0,0.18);')
    );

    var closeBtn = makeCloseButton(function () {
      self._dismiss();
    }, 'small', this.form.container_close_icon_color);

    var iframeWrap = this._createIframe(iframeSrc, 300, { onReady: function () {
      panel.style.opacity = '';
      panel.style.animation = animName + ' 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      remeasureAtWidth(self, panel.offsetWidth);
    }});
    panel.appendChild(closeBtn);
    panel.appendChild(iframeWrap);
    document.body.appendChild(panel);
    this.chrome = panel;
  };

  // ─── Render: Sticky Bar ─────────────────────────────────────────────────

  BeehiivEmbed.prototype._renderStickyBar = function (iframeSrc, position) {
    var self = this;
    var isTop = position === 'top';
    var shadowDir = isTop ? '0 4px 24px' : '0 -4px 24px';
    var paddingProp = isTop ? 'paddingTop' : 'paddingBottom';

    var isTransparent = this.form.container_background_transparent;
    var bgColor = this.form.container_background_color || '#fff';
    var alignment = this.form.container_horizontal_alignment || 'center';
    var isSlim = this.form.layout === 'slim';
    var bar = makeEl('div',
      'position:fixed;' + position + ':0;left:0;right:0;' +
      'display:flex;justify-content:' + alignment + ';align-items:center;' +
      'z-index:2147483647;opacity:0;' +
      (isTransparent
        ? 'background:transparent;'
        : 'background:' + bgColor + ';box-shadow:' + shadowDir + ' rgba(0,0,0,0.12);')
    );
    bar.id = 'bhv-sticky-bar-' + this.formId;

    var closeBtn = makeCloseButton(function () {
      self._dismiss();
    }, 'small', this.form.container_close_icon_color);

    var iframeWrap = this._createIframe(iframeSrc, 72, {
      onReady: function () {
        bar.style.opacity = '';
        bar.style.animation = 'bhv-fade-in 0.3s ease';
        requestAnimationFrame(function () {
          // Constrain iframe to viewport so close X stays visible on mobile.
          // Inner = iframe + 2*pad(12) + spacer(26) + 2*gap(8) + close(26) = iframe + 92.
          remeasureAtWidth(self, bar.offsetWidth - 92);
        });
      },
      // Track every accepted styles update so body padding stays correct
      // through the post-remeasure round-trip on mobile.
      onResize: function () {
        document.body.style[paddingProp] = bar.offsetHeight + 'px';
      }
    });

    // Mirror the close button width on the left so the iframe stays centered
    // in the bar. Absolute-positioning the close X would overlap slim sticky's
    // submit button — keeping it inline avoids that, but requires a spacer
    // to balance the layout.
    var inner = makeEl('div',
      'display:flex;align-items:' + (isSlim ? 'center' : 'flex-start') + ';' +
      'gap:8px;padding:8px 12px;'
    );
    var leftSpacer = makeEl('div', 'width:26px;flex-shrink:0;');
    inner.appendChild(leftSpacer);
    inner.appendChild(iframeWrap);
    // Sticky lays the close X out inline (inside the flex row) instead of
    // absolutely-positioned over the bar — the spacer above balances it.
    closeBtn.style.position = 'static';
    closeBtn.style.flexShrink = '0';
    inner.appendChild(closeBtn);
    bar.appendChild(inner);
    document.body.appendChild(bar);
    this.chrome = bar;
  };

  // ─── Dismiss (close + frequency cap + cleanup) ──────────────────────────

  BeehiivEmbed.prototype._dismiss = function () {
    if (this.form) markDismissed(this.form.id);
    this.destroy();
  };

  // ─── Helpers ────────────────────────────────────────────────────────────

  function remeasureAtWidth(embed, containerWidth) {
    var iframe = embed.iframe;
    if (!iframe || containerWidth >= parseFloat(iframe.style.width)) return;
    iframe.removeAttribute('data-bhv-sized');
    iframe.style.width = containerWidth + 'px';
    iframe.style.height = '2000px';
    iframe.contentWindow.postMessage({ type: 'beehiiv:resize' }, '*');
  }

  function makeEl(tag, css) {
    var e = document.createElement(tag);
    e.style.cssText = css;
    return e;
  }

  function makeCloseButton(onClick, variant, iconColor) {
    var btn = document.createElement('button');
    var isSmall = variant === 'small';
    var size = isSmall ? 14 : 16;
    btn.innerHTML =
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
    btn.setAttribute('aria-label', 'Close');
    btn.style.cssText =
      'position:absolute;top:12px;right:12px;' +
      'background:transparent;border:none;cursor:pointer;padding:0;' +
      'width:' + (isSmall ? '26px' : '32px') + ';height:' + (isSmall ? '26px' : '32px') + ';' +
      'display:flex;align-items:center;justify-content:center;' +
      'color:' + (iconColor || '#333333') + ';z-index:1;';
    btn.addEventListener('click', onClick);
    return btn;
  }

  var stylesInjected = false;
  function injectGlobalStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    var s = document.createElement('style');
    s.textContent =
      '@keyframes bhv-fade-in { from{opacity:0} to{opacity:1} }' +
      '@keyframes bhv-slide-up { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }' +
      '@keyframes bhv-slide-from-right { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }' +
      '@keyframes bhv-slide-from-left { from{transform:translateX(-110%);opacity:0} to{transform:translateX(0);opacity:1} }';
    document.head.appendChild(s);
  }

  // ─── Entry point ────────────────────────────────────────────────────────

  function init() {
    var scripts = document.querySelectorAll('script[data-beehiiv-form]');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.getAttribute('data-bhv-initialized')) continue;
      script.setAttribute('data-bhv-initialized', 'true');
      var embed = new BeehiivEmbed(script);
      embed.init();
    }
  }

  // ─── Boot ───────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();