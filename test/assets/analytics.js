// Configure the existing public Google identifier in analytics.json, then rebuild.
// Loading is disabled in local previews; no extra analytics property is created.
(function () {
  if (!/^(www\.)?madridunpacked\.com$/.test(location.hostname)) return;
  var gtm = document.body.getAttribute('data-gtm-id') || '';
  var ga4 = document.body.getAttribute('data-ga4-id') || '';
  window.dataLayer = window.dataLayer || [];
  var script = document.createElement('script');
  script.async = true;
  if (/^GTM-[A-Z0-9]+$/.test(gtm)) {
    window.dataLayer.push({'gtm.start': Date.now(), event: 'gtm.js'});
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtm);
    document.head.appendChild(script);
    return;
  }
  if (/^G-[A-Z0-9]+$/.test(ga4)) {
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // site.js owns the page_view event in direct GA4 mode.
    window.gtag('config', ga4, {send_page_view: false});
    window.MU_ANALYTICS = function (name, props) {
      var payload = Object.assign({}, props);
      if (name === 'page_view') {
        payload.page_title = document.title;
        payload.page_location = document.querySelector('link[rel="canonical"]').href;
      }
      window.gtag('event', name, payload);
    };
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4);
    document.head.appendChild(script);
  }
})();
