function formatCookie(co) {
  return [
    [
      co.httpOnly ? '#HttpOnly_' : '',
      !co.hostOnly && co.domain && !co.domain.startsWith('.') ? '.' : '',
      co.domain
    ].join(''),
    co.hostOnly ? 'FALSE' : 'TRUE',
    co.path,
    co.secure ? 'TRUE' : 'FALSE',
    co.session || !co.expirationDate ? 0 : co.expirationDate,
    co.name,
    co.value + '\n'
  ].join('\t');
}

async function getCookiesFilename(storeId) {
  if (storeId == 'firefox-default') {
    return 'cookies.txt'
  } else {
    let container;
    try {
      container = await browser.contextualIdentities.get(storeId);
    } catch (e) {
      /* In case we can't get the name of the container, fallback on the storeId */
      container = storeId
    }
    return 'cookies.' + container.name + '.txt'
  }
}

async function saveCookies(cookies) {
  var header = [
    '# Netscape HTTP Cookie File\n',
    '# https://curl.haxx.se/rfc/cookie_spec.html\n',
    '# This is a generated file! Do not edit.\n\n'
  ];
  var body = cookies.map(formatCookie)
  let storeId = cookies.length ? cookies[0].storeId : null;
  var blob = new Blob(header.concat(body), {type: 'text/plain'});
  var objectURL = URL.createObjectURL(blob);
  let cookiesFilename = await getCookiesFilename(storeId)
  browser.downloads.download(
    {
      url: objectURL,
      filename: cookiesFilename,
      saveAs: true,
      conflictAction: 'overwrite'
    }
  );
}

function getCookies(stores_filter) {
  for (var store of stores_filter.stores) {
    console.log("Store: " + store.id)
    var gettingAll = browser.cookies.getAll({
        ...stores_filter.filter,
        ...{ storeId: store.id, firstPartyDomain: null }});
    gettingAll.then(saveCookies);
  }
}

function handleClick(filter = {}) {
  var gettingAllStores = browser.cookies.getAllCookieStores()
  gettingAllStores
    .then(stores => ({stores: stores, filter: filter}))
    .then(getCookies);
}

browser.runtime.onMessage.addListener(handleClick)
