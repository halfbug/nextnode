console.log('v2 Script Triggered');

// Define App Url
window.APPv2URL = 'https://api-stage.groupshop.co';

// App Status
window.STATUS = true;

// Get Store url
window.storeurl = Shopify.shop;
// Get product id
var producthandle = window.location.href.split('?')[0];
window.PRODUCT_ID = '';

async function fetchStore(shop) {
  let response = await fetch(`${window.APPv2URL}/ext/store?shop=${shop}`);

  console.log(response.status); // 200
  console.log(response.statusText); // OK

  if (response.status === 200) {
    let data = await response.json();
    return data;
  }
}

async function fetchStoreLogo(imgPath) {
  let response = await fetch(`${window.APPv2URL}/image?key=${imgPath}`);

  console.log(response.status); // 200
  console.log(response.statusText); // OK

  if (response.status === 200) {
    let data = await response.json();
    return data;
  }
}

async function fetchGroupshopURL(storeid, campaignid, productid) {
  const rawResponse = await fetch(`${window.APPv2URL}/ext/gslink`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ storeid, campaignid, productid }),
  });
  const content = await rawResponse.json();

  console.log(content);
  return content;
}

async function fetchProduct() {
  console.log(
    '🚀 ~ file: gropshop-pdp.js ~ line 33 ~ fetchProduct ~ producthandle',
    producthandle,
  );
  let response = await fetch(producthandle + '.json');
  console.log(response.status); // 200
  console.log(response.statusText); // OK

  if (response.status === 200) {
    let data = await response.json();
    console.log(data);
    return data;
  }
}

function displayBanner(price) {
  //create banner element
  var banner = document.createElement('div');
  banner.innerHTML = `<div class="grp-shop-logo"><img src="https://app.groupshop.co//images/GROUPSHOP-logo.svg" class="link-logo"></div> <div class="grp-shop-text">(v2)Shop with friends, <br> get <strong>$${price} cashback</strong></div>`;
  banner.className = 'yellow_banner';
  banner.id = 'grp-shop-section-2';
  banner.setAttribute('data-gs-toggle', 'groupshop_modal');
  banner.setAttribute('data-gs-target', '#gsmodal');
  banner.setAttribute('data-gs-backdrop', 'static');

  // get element on page and add banner before it
  var target = [...document.forms].find((frm) =>
    frm.action.includes('cart/add'),
  );
  target.before(banner);
}

function addModal() {
  //create banner element
  console.log(gsbootstrap);
  var gsModal = document.createElement('div');
  gsModal.className =
    'groupshop_modal groupshop_fade modal-gss shopdealcartmodel';
  gsModal.id = 'gsmodal';
  gsModal.setAttribute('aria-hidden', true);
  gsModal.setAttribute('tabindex', '-1');
  gsModal.setAttribute('data-bs-backdrop', 'static');

  gsModal.innerHTML = ` <div class="groupshop_modal-dialog  modal-dialog-gss modal-dialog-centered-gss">
    <div class="groupshop_modal-content">
      <div class="groupshop_modal-body modal-content-gss">
      
        <div class="modal-header-gss">
        <button type="button" class="groupshop_btn-close" data-gs-dismiss="groupshop_modal" aria-label="Close"></button>
        <div class="rbb-popup-head-wrap"><div class="rbb-popup-head"><div class="rbb-popup-logo"><embed src="https://app.groupshop.co/images/GROUPSHOP-logo.svg" class="rb-main-logo"></div>
        <div class="rbb-popup-logo2" id="brand-logo">
        <img src="https://app.groupshop.co/images/setti0907.png" width="20" height="30" class="second-logo addtc-np" loading="lazy">
        </div>
        </div></div></div><div id="main-popup-gss" class="modal-body-gss" style="background-color:#ffffff" ;=""><div class="how-complete-0"><span class="dont_pay_full"><span class="gradient-pay">Pay less</span> when you <span class="gradient-pay">shop with friends</span></span></div><div class="rb-text-2">You and your friends can <strong>earn up to 90% cashback and discounts</strong> when you shop together through Groupshop!</div><div class="to-start-wrap"><div class="to-start">To start earning</div></div><div class="rb-how-modal">													 <div class="rb-howshop">													    <div class="how-shop-img"><embed src="https://app.groupshop.co/images/newcarticon.svg"></div>													    <div class="how-shop-desc">Complete your order</div>													 </div>													 <div class="rb-howshop">													    <div class="how-shop-img"><embed src="https://app.groupshop.co/images/newmail.svg"></div>													    <div class="how-shop-desc">Share your Groupshop link with friends to give them access to <strong>exclusive discounts.</strong></div>													 </div>													 <div class="rb-howshop">													    <div class="how-shop-img"><embed src="https://app.groupshop.co/images/newemoji.svg"></div>													    <div class="how-shop-desc">Earn up to <strong>90% cashback</strong> when friends shop</div>													 </div>													</div><div class="how-complete-4 sec-4"><div class="how-complete-wrap-4"><span class="shop-with-1">The more friends, the more rewards for &nbsp;<br>everyone. It’s that simple!</span></div></div><div class="how-complete-5 sec-5"><a class="keep-shop" data-gs-dismiss="groupshop_modal" aria-label="Close">Keep shopping</a></div>
        <div class="footer-end" id="today-offer-gs">
        </div><div id="pdp-ajax-res"></div></div><div id="inner-detail-popup" class="modal-body-gss" style="background-color:#ffffff; display:none"><div class="how-work-wrap"><div class="how-work-text">How does it work</div></div><div class="info-box-wrap mb-53"><div class="info-box"><span class="info-num">1</span><div class="info-part-1 info-text">Start by adding products to your cart and then complete your purchase</div><div class="info-part-2 info-text"><span class="info-footer">SHOP</span><span class="info-icon"><span class="info-icon-bg">
          <img src="{{ 'cart-pdp.svg' | asset_url }}" width="104" height="8" loading="lazy">
        </span></span></div></div></div><div class="info-box-wrap mb-53"><div class="info-box"><span class="info-num">2</span><div class="info-part-1 info-text">Next you will recieve an email with your groupshop page link, share your Group Shop link with friends</div><div class="info-part-2 info-text"><span class="info-footer">SHARE</span><span class="info-icon"><span class="info-icon-bg">
          <img src="{{ 'share-pdp.svg' | asset_url }}" width="104" height="8" loading="lazy">
        </span></span></div></div></div><div class="info-box-wrap"><div class="info-box"><span class="info-num">3</span><div class="info-part-1 info-text">Your friends get up to 35% OFF for shopping on your Group Shop and you earn up to 90% cashback when friends shop with you</div><div class="info-part-2 info-text"><span class="info-footer">EARN</span><span class="info-icon"><span class="info-icon-bg">
          <img src="{{ 'dollar-pdp.svg' | asset_url }}" width="14" height="8" loading="lazy">
        </span></span></div></div></div><div class="footer-notice-wrap"><div class="notice">Bonus: You can shop from your own groupshop and keep the cashback and discounts for your self</div></div></div></div>
      
      </div>
      
    </div>
  </div>`;

  // add modal code some where in page
  document.body.append(gsModal);
}

async function injectScript(url) {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;

  document.head.appendChild(script);
  await eval(script);
}

function injectStyleSheet(url) {
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.crossorigin = 'anonymous';
  style.href = url;

  document.head.appendChild(style);
}

async function init() {
  try {
    // fetch store detail
    const store = await fetchStore(Shopify.shop);
    console.log('🚀 ~ file: groupshop-pdp.js ~ line 124 ~ init ~ store', store);
    if (store.status === 'Active') {
      const {
        product: {
          variants: [product],
          id: product_id,
        },
      } = await fetchProduct();

      fetchGroupshopURL(store.id, store.campaignId, product_id).then((res) => {
        if (!!res.url) {
          var elem = document.getElementById('today-offer-gs');
          elem.innerHTML = `<a target="_blank" class="join-vur-shop" id="looking-groupdeal" href="${res.url}">Or join an existing Groupshop and get <br>up to ${store.discount} off today <span class="footer-arrow"></span></a>`;
        }
      });

      fetchStoreLogo(store.logoImage.split('/')[4]).then(({ data: url }) => {
        if (!!url) {
          var elem = document.getElementById('brand-logo');
          elem.innerHTML = `<img src="${url}" width="20" height="30" class="second-logo addtc-np" loading="lazy"></img>`;
        }
      });

      console.log(product);
      // injectScript('https://5d93-39-51-118-157.ngrok.io/public/gsbootstrap.js');
      injectStyleSheet(`${window.APPv2URL}/public/groupdeal.css`);
      injectStyleSheet(`${window.APPv2URL}/public/gsbootstrap.css`);

      addModal();
      displayBanner(+product.price * 0.5);
    }
  } catch (err) {
    console.log(JSON.stringify(err));
  }
}

init();
