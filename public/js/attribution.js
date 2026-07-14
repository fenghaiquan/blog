(function() {
  var AttributionTracker = {
    config: {
      cookieName: 'attribution_data',
      cookieExpiry: 30,
      debugMode: false,
      childOrigin: 'https://subscribe-forms.beehiiv.com',
      childStagingOrigin: 'https://subscribe-forms.staginghiiv.com'
    },

    /**
     * Parse URL parameters for attribution data
     */
    parseParameters: function() {
      var parsed = {};
      var urlParams = new URL(document.location).searchParams;

      if (!urlParams) return parsed;

      // Track standard UTM parameters
      var utmParams = ['source', 'medium', 'campaign', 'term', 'content'];
      for (var i = 0; i < utmParams.length; i++) {
        var param = utmParams[i];
        var value = urlParams.get('utm_' + param);
        if (value) parsed[param] = value;
      }

      // Handle ad platform click IDs if UTM source/medium not present
      if (!urlParams.has('utm_source') && !urlParams.has('utm_medium')) {
        var cpc = {
          google: ['gclid', 'gclsrc', 'dclid', 'wbraid', 'gbraid', 'gad_source'],
          facebook: 'fbclid',
          bing: 'msclkid',
          linkedin: 'li_fat_id',
          tiktok: 'ttclid',
          twitter: 'twclid'
        };

        for (var source in cpc) {
          if (cpc.hasOwnProperty(source)) {
            var clickIds = cpc[source];
            var ids = Array.isArray(clickIds) ? clickIds : [clickIds];
            var hasClickId = false;

            for (var j = 0; j < ids.length; j++) {
              if (urlParams.has(ids[j])) {
                hasClickId = true;
                break;
              }
            }

            if (hasClickId) {
              parsed.source = source;
              parsed.medium = 'cpc';
              break;
            }
          }
        }
      }

      return parsed;
    },

    /**
     * Parse referrer information
     */
    parseReferrer: function() {
      if (!document.referrer) return {};

      var referrer = new URL(document.referrer);
      var currentDomain = window.location.hostname;

      // Don't track internal referrers
      if (referrer.hostname === currentDomain) {
        return {};
      }

      var parsed = {
        source: referrer.hostname,
        medium: 'referral'
      };

      var rules = {
        organic: {
          google: '^www\\.(google)\\.[a-z]{2,3}(?:\\.[a-z]{2})?$',
          bing: '^www\\.(bing)\\.com$',
          duckduckgo: '^(duckduckgo)\\.com$',
          yahoo: '^(?:www|m)?\\.?(yahoo)\\.(?:com|cn)$',
          ecosia: '^www\\.(ecosia)\\.org$',
          ask: '^www\\.(ask)\\.com$',
          aol: '^(?:search\\.)?(aol)\\.com$',
          baidu: '^www\\.(baidu)\\.com$',
          yandex: '^(?:www\\.)?(yandex)\\.com|ru$'
        },
        social: {
          linkedin: '^www\\.(linkedin)\\.com$',
          facebook: '^www\\.(facebook)\\.com$',
          twitter: '^t\\.co$',
          instagram: '^l\\.(instagram)\\.com$',
          pinterest: '^www\\.(pinterest)\\.com$',
          youtube: '^www\\.(youtube)\\.com$'
        }
      };

      for (var medium in rules) {
        if (rules.hasOwnProperty(medium)) {
          for (var source in rules[medium]) {
            if (rules[medium].hasOwnProperty(source)) {
              if (new RegExp(rules[medium][source]).test(referrer.hostname)) {
                parsed.source = source;
                parsed.medium = medium;
                return parsed;
              }
            }
          }
        }
      }

      return parsed;
    },

    /**
     * Get attribution data from cookies
     */
    getCookie: function(name) {
      var value = '; ' + document.cookie;
      var parts = value.split('; ' + name + '=');
      if (parts.length === 2) {
        try {
          return JSON.parse(decodeURIComponent(parts.pop().split(';').shift()));
        } catch (e) {
          return null;
        }
      }
      return null;
    },

    /**
     * Set attribution data cookie
     */
    setCookie: function(name, value, days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      var expires = 'expires=' + date.toUTCString();
      document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + '; ' + expires + '; path=/';
    },

    /**
     * Get current attribution data
     */
    getAttributionData: function() {
      var params = this.parseParameters();
      var referrerData = Object.keys(params).length === 0 ? this.parseReferrer() : {};
      var existingData = this.getCookie(this.config.cookieName) || {};

      // If no new attribution data, return existing
      if (Object.keys(params).length === 0 && Object.keys(referrerData).length === 0) {
        return existingData;
      }

      var attributionData = this.extend({}, existingData, referrerData, params, {
        last_updated: new Date().toISOString(),
        referrer: document.referrer,
        landing_page: window.location.href
      });

      this.setCookie(this.config.cookieName, attributionData, this.config.cookieExpiry);
      return attributionData;
    },

    /**
     * Simple object extend function
     */
    extend: function() {
      var extended = {};
      var deep = false;
      var i = 0;
      var length = arguments.length;

      if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
        deep = arguments[0];
        i++;
      }

      for (; i < length; i++) {
        var obj = arguments[i];
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            extended[key] = obj[key];
          }
        }
      }

      return extended;
    },

    /**
     * Get client ID from dataLayer
     */
    getClientIdFromDataLayer: function() {
      var dataLayer = window.dataLayer || [];
      for (var i = 0; i < dataLayer.length; i++) {
        var item = dataLayer[i];
        if (item && item['ga-client-id']) {
          return item['ga-client-id'];
        }
      }
      return null;
    },

    /**
     * Handle messages from child iframe
     */
    messageHandler: function(event) {
      // Verify origin for security
      if (event.origin !== this.config.childOrigin && event.origin !== this.config.childStagingOrigin) return;

      // Handle initial child ready message
      if (event.data === 'childReady') {
        // Respond that parent is ready
        event.source.postMessage('parentReady', event.origin);

        // Get client ID from dataLayer if available
        if (window.dataLayer) {
          var clientId = this.getClientIdFromDataLayer();
          if (clientId) {
            event.source.postMessage({
              event: 'clientId',
              clientId: clientId
            }, event.origin);
          }
        }
      }

      // Push events from iframe to parent dataLayer
      if (event.data && event.data.event) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(event.data);
      }
    },

    /**
     * Update iframes with attribution data
     */
    updateIframes: function() {
      var self = this;
      var iframes = document.querySelectorAll('iframe[data-test-id="beehiiv-embed"]');
      var attributionData = this.getAttributionData();

      var shouldAddParameters = function(url) {
        var urlObj = new URL(url);
        return !urlObj.searchParams.has('utm_source') &&
               !urlObj.searchParams.has('utm_medium') &&
               !urlObj.searchParams.has('utm_campaign') &&
               !urlObj.searchParams.has('referrer');
      };

      var addParametersToURL = function(url) {
        var urlObj = new URL(url);

        // Add attribution parameters
        if (attributionData.source) urlObj.searchParams.set('utm_source', attributionData.source);
        if (attributionData.medium) urlObj.searchParams.set('utm_medium', attributionData.medium);
        if (attributionData.campaign) urlObj.searchParams.set('utm_campaign', attributionData.campaign);

        // Add additional parameters
        urlObj.searchParams.set('referrer', encodeURIComponent(window.location.href));

        return urlObj.toString();
      };

      for (var i = 0; i < iframes.length; i++) {
        if (shouldAddParameters(iframes[i].src)) {
          iframes[i].src = addParametersToURL(iframes[i].src);
        }
      }
    },

    /**
     * Initialize the attribution tracking and message handling
     */
    init: function() {
      try {
        if (this.config.debugMode) {
          console.log('[ATTRIBUTION_TRACKER]: Initializing...');
        }

        // Bind message handler to maintain 'this' context
        var boundMessageHandler = this.messageHandler.bind(this);
        window.addEventListener('message', boundMessageHandler);

        this.updateIframes();

        if (this.config.debugMode) {
          console.log('[ATTRIBUTION_TRACKER]: Attribution data:', this.getAttributionData());
        }
      } catch (error) {
        console.error('[ATTRIBUTION_TRACKER]: Initialization error:', error);
      }
    }
  };

  // Initialize the tracker
  AttributionTracker.init();
})();