console.log('v2 Script Triggered');
// Define App Url
// window.BURL = 'https://9f74-39-51-3-243.ngrok.io';
// window.FURL = 'http://localhost:3000';

window.BURL = 'https://api-stage.groupshop.co';
window.FURL = 'http://front-stage.groupshop.co';
window.GSURL = window.FURL;
/* @preserve
    _____ __ _     __                _
   / ___// /(_)___/ /___  ____      (_)___
  / (_ // // // _  // -_)/ __/_    / /(_-<
  \___//_//_/ \_,_/ \__//_/  (_)__/ //___/
                              |___/

  Version: 1.7.4
  Author: Nick Piscitelli (pickykneee)
  Website: https://nickpiscitelli.com
  Documentation: http://nickpiscitelli.github.io/Glider.js
  License: MIT License
  Release Date: October 25th, 2018

*/
// eslint-disable-next-line @typescript-eslint/no-this-alias
!(function (e) {
  'function' == typeof define && define.amd
    ? define(e)
    : 'object' == typeof exports
    ? (module.exports = e())
    : e();
})(function () {
  var a = 'undefined' != typeof window ? window : this,
    e = (a.Glider = function (e, t) {
      var o = this;
      if (e._glider) return e._glider;
      if (
        ((o.ele = e),
        o.ele.classList.add('glider'),
        ((o.ele._glider = o).opt = Object.assign(
          {},
          {
            slidesToScroll: 1,
            slidesToShow: 1,
            resizeLock: !0,
            duration: 0.5,
            easing: function (e, t, o, i, r) {
              return i * (t /= r) * t + o;
            },
          },
          t,
        )),
        (o.animate_id = o.page = o.slide = 0),
        (o.arrows = {}),
        (o._opt = o.opt),
        o.opt.skipTrack)
      )
        o.track = o.ele.children[0];
      else
        for (
          o.track = document.createElement('div'), o.ele.appendChild(o.track);
          1 !== o.ele.children.length;

        )
          o.track.appendChild(o.ele.children[0]);
      o.track.classList.add('glider-track'),
        o.init(),
        (o.resize = o.init.bind(o, !0)),
        o.event(o.ele, 'add', { scroll: o.updateControls.bind(o) }),
        o.event(a, 'add', { resize: o.resize });
    }),
    t = e.prototype;
  return (
    (t.init = function (e, t) {
      var o = this,
        i = 0,
        r = 0;
      (o.slides = o.track.children),
        [].forEach.call(o.slides, function (e, t) {
          e.classList.add('glider-slide'), e.setAttribute('data-gslide', t);
        }),
        (o.containerWidth = o.ele.clientWidth);
      var s = o.settingsBreakpoint();
      if (
        (t || (t = s),
        'auto' === o.opt.slidesToShow || void 0 !== o.opt._autoSlide)
      ) {
        var l = o.containerWidth / o.opt.itemWidth;
        o.opt._autoSlide = o.opt.slidesToShow = o.opt.exactWidth
          ? l
          : Math.max(1, Math.floor(l));
      }
      'auto' === o.opt.slidesToScroll &&
        (o.opt.slidesToScroll = Math.floor(o.opt.slidesToShow)),
        (o.itemWidth = o.opt.exactWidth
          ? o.opt.itemWidth
          : o.containerWidth / o.opt.slidesToShow),
        [].forEach.call(o.slides, function (e) {
          (e.style.height = 'auto'),
            (e.style.width = o.itemWidth + 'px'),
            (i += o.itemWidth),
            (r = Math.max(e.offsetHeight, r));
        }),
        (o.track.style.width = i + 'px'),
        (o.trackWidth = i),
        (o.isDrag = !1),
        (o.preventClick = !1),
        o.opt.resizeLock && o.scrollTo(o.slide * o.itemWidth, 0),
        (s || t) && (o.bindArrows(), o.buildDots(), o.bindDrag()),
        o.updateControls(),
        o.emit(e ? 'refresh' : 'loaded');
    }),
    (t.bindDrag = function () {
      var t = this;
      t.mouse = t.mouse || t.handleMouse.bind(t);
      var e = function () {
          (t.mouseDown = void 0),
            t.ele.classList.remove('drag'),
            t.isDrag && (t.preventClick = !0),
            (t.isDrag = !1);
        },
        o = {
          mouseup: e,
          mouseleave: e,
          mousedown: function (e) {
            e.preventDefault(),
              e.stopPropagation(),
              (t.mouseDown = e.clientX),
              t.ele.classList.add('drag');
          },
          mousemove: t.mouse,
          click: function (e) {
            t.preventClick && (e.preventDefault(), e.stopPropagation()),
              (t.preventClick = !1);
          },
        };
      t.ele.classList.toggle('draggable', !0 === t.opt.draggable),
        t.event(t.ele, 'remove', o),
        t.opt.draggable && t.event(t.ele, 'add', o);
    }),
    (t.buildDots = function () {
      var e = this;
      if (e.opt.dots) {
        if (
          ('string' == typeof e.opt.dots
            ? (e.dots = document.querySelector(e.opt.dots))
            : (e.dots = e.opt.dots),
          e.dots)
        ) {
          (e.dots.innerHTML = ''), e.dots.classList.add('glider-dots');
          for (
            var t = 0;
            t < Math.ceil(e.slides.length / e.opt.slidesToShow);
            ++t
          ) {
            var o = document.createElement('button');
            (o.dataset.index = t),
              o.setAttribute('aria-label', 'Page ' + (t + 1)),
              o.setAttribute('role', 'tab'),
              (o.className = 'glider-dot ' + (t ? '' : 'active')),
              e.event(o, 'add', { click: e.scrollItem.bind(e, t, !0) }),
              e.dots.appendChild(o);
          }
        }
      } else e.dots && (e.dots.innerHTML = '');
    }),
    (t.bindArrows = function () {
      var o = this;
      o.opt.arrows
        ? ['prev', 'next'].forEach(function (e) {
            var t = o.opt.arrows[e];
            t &&
              ('string' == typeof t && (t = document.querySelector(t)),
              t &&
                ((t._func = t._func || o.scrollItem.bind(o, e)),
                o.event(t, 'remove', { click: t._func }),
                o.event(t, 'add', { click: t._func }),
                (o.arrows[e] = t)));
          })
        : Object.keys(o.arrows).forEach(function (e) {
            var t = o.arrows[e];
            o.event(t, 'remove', { click: t._func });
          });
    }),
    (t.updateControls = function (e) {
      var d = this;
      e && !d.opt.scrollPropagate && e.stopPropagation();
      var t = d.containerWidth >= d.trackWidth;
      d.opt.rewind ||
        (d.arrows.prev &&
          (d.arrows.prev.classList.toggle(
            'disabled',
            d.ele.scrollLeft <= 0 || t,
          ),
          d.arrows.prev.setAttribute(
            'aria-disabled',
            d.arrows.prev.classList.contains('disabled'),
          )),
        d.arrows.next &&
          (d.arrows.next.classList.toggle(
            'disabled',
            Math.ceil(d.ele.scrollLeft + d.containerWidth) >=
              Math.floor(d.trackWidth) || t,
          ),
          d.arrows.next.setAttribute(
            'aria-disabled',
            d.arrows.next.classList.contains('disabled'),
          ))),
        (d.slide = Math.round(d.ele.scrollLeft / d.itemWidth)),
        (d.page = Math.round(d.ele.scrollLeft / d.containerWidth));
      var c = d.slide + Math.floor(Math.floor(d.opt.slidesToShow) / 2),
        h = Math.floor(d.opt.slidesToShow) % 2 ? 0 : c + 1;
      1 === Math.floor(d.opt.slidesToShow) && (h = 0),
        d.ele.scrollLeft + d.containerWidth >= Math.floor(d.trackWidth) &&
          (d.page = d.dots ? d.dots.children.length - 1 : 0),
        [].forEach.call(d.slides, function (e, t) {
          var o = e.classList,
            i = o.contains('visible'),
            r = d.ele.scrollLeft,
            s = d.ele.scrollLeft + d.containerWidth,
            l = d.itemWidth * t,
            n = l + d.itemWidth;
          [].forEach.call(o, function (e) {
            /^left|right/.test(e) && o.remove(e);
          }),
            o.toggle('active', d.slide === t),
            c === t || (h && h === t)
              ? o.add('center')
              : (o.remove('center'),
                o.add(
                  [
                    t < c ? 'left' : 'right',
                    Math.abs(t - (t < c ? c : h || c)),
                  ].join('-'),
                ));
          var a =
            Math.ceil(l) >= Math.floor(r) && Math.floor(n) <= Math.ceil(s);
          o.toggle('visible', a),
            a !== i &&
              d.emit('slide-' + (a ? 'visible' : 'hidden'), { slide: t });
        }),
        d.dots &&
          [].forEach.call(d.dots.children, function (e, t) {
            e.classList.toggle('active', d.page === t);
          }),
        e &&
          d.opt.scrollLock &&
          (clearTimeout(d.scrollLock),
          (d.scrollLock = setTimeout(function () {
            clearTimeout(d.scrollLock),
              0.02 < Math.abs(d.ele.scrollLeft / d.itemWidth - d.slide) &&
                (d.mouseDown ||
                  (d.trackWidth > d.containerWidth + d.ele.scrollLeft &&
                    d.scrollItem(d.getCurrentSlide())));
          }, d.opt.scrollLockDelay || 250)));
    }),
    (t.getCurrentSlide = function () {
      var e = this;
      return e.round(e.ele.scrollLeft / e.itemWidth);
    }),
    (t.scrollItem = function (e, t, o) {
      o && o.preventDefault();
      var i = this,
        r = e;
      if ((++i.animate_id, !0 === t))
        (e *= i.containerWidth),
          (e = Math.round(e / i.itemWidth) * i.itemWidth);
      else {
        if ('string' == typeof e) {
          var s = 'prev' === e;
          if (
            ((e =
              i.opt.slidesToScroll % 1 || i.opt.slidesToShow % 1
                ? i.getCurrentSlide()
                : i.slide),
            s ? (e -= i.opt.slidesToScroll) : (e += i.opt.slidesToScroll),
            i.opt.rewind)
          ) {
            var l = i.ele.scrollLeft;
            e =
              s && !l
                ? i.slides.length
                : !s && l + i.containerWidth >= Math.floor(i.trackWidth)
                ? 0
                : e;
          }
        }
        (e = Math.max(Math.min(e, i.slides.length), 0)),
          (i.slide = e),
          (e = i.itemWidth * e);
      }
      return (
        i.scrollTo(
          e,
          i.opt.duration * Math.abs(i.ele.scrollLeft - e),
          function () {
            i.updateControls(),
              i.emit('animated', {
                value: r,
                type: 'string' == typeof r ? 'arrow' : t ? 'dot' : 'slide',
              });
          },
        ),
        !1
      );
    }),
    (t.settingsBreakpoint = function () {
      var e = this,
        t = e._opt.responsive;
      if (t) {
        t.sort(function (e, t) {
          return t.breakpoint - e.breakpoint;
        });
        for (var o = 0; o < t.length; ++o) {
          var i = t[o];
          if (a.innerWidth >= i.breakpoint)
            return (
              e.breakpoint !== i.breakpoint &&
              ((e.opt = Object.assign({}, e._opt, i.settings)),
              (e.breakpoint = i.breakpoint),
              !0)
            );
        }
      }
      var r = 0 !== e.breakpoint;
      return (e.opt = Object.assign({}, e._opt)), (e.breakpoint = 0), r;
    }),
    (t.scrollTo = function (t, o, i) {
      var r = this,
        s = new Date().getTime(),
        l = r.animate_id,
        n = function () {
          var e = new Date().getTime() - s;
          (r.ele.scrollLeft =
            r.ele.scrollLeft +
            (t - r.ele.scrollLeft) * r.opt.easing(0, e, 0, 1, o)),
            e < o && l === r.animate_id
              ? a.requestAnimationFrame(n)
              : ((r.ele.scrollLeft = t), i && i.call(r));
        };
      a.requestAnimationFrame(n);
    }),
    (t.removeItem = function (e) {
      var t = this;
      t.slides.length &&
        (t.track.removeChild(t.slides[e]), t.refresh(!0), t.emit('remove'));
    }),
    (t.addItem = function (e) {
      this.track.appendChild(e), this.refresh(!0), this.emit('add');
    }),
    (t.handleMouse = function (e) {
      var t = this;
      t.mouseDown &&
        ((t.isDrag = !0),
        (t.ele.scrollLeft +=
          (t.mouseDown - e.clientX) * (t.opt.dragVelocity || 3.3)),
        (t.mouseDown = e.clientX));
    }),
    (t.round = function (e) {
      var t = 1 / (this.opt.slidesToScroll % 1 || 1);
      return Math.round(e * t) / t;
    }),
    (t.refresh = function (e) {
      this.init(!0, e);
    }),
    (t.setOption = function (t, e) {
      var o = this;
      o.breakpoint && !e
        ? o._opt.responsive.forEach(function (e) {
            e.breakpoint === o.breakpoint &&
              (e.settings = Object.assign({}, e.settings, t));
          })
        : (o._opt = Object.assign({}, o._opt, t)),
        (o.breakpoint = 0),
        o.settingsBreakpoint();
    }),
    (t.destroy = function () {
      var e = this,
        t = e.ele.cloneNode(!0),
        o = function (t) {
          t.removeAttribute('style'),
            [].forEach.call(t.classList, function (e) {
              /^glider/.test(e) && t.classList.remove(e);
            });
        };
      (t.children[0].outerHTML = t.children[0].innerHTML),
        o(t),
        [].forEach.call(t.getElementsByTagName('*'), o),
        e.ele.parentNode.replaceChild(t, e.ele),
        e.event(a, 'remove', { resize: e.resize }),
        e.emit('destroy');
    }),
    (t.emit = function (e, t) {
      var o = new a.CustomEvent('glider-' + e, {
        bubbles: !this.opt.eventPropagate,
        detail: t,
      });
      this.ele.dispatchEvent(o);
    }),
    (t.event = function (e, t, o) {
      var i = e[t + 'EventListener'].bind(e);
      Object.keys(o).forEach(function (e) {
        i(e, o[e]);
      });
    }),
    e
  );
});

var shop = Shopify.shop;
var orderId = Shopify.checkout.order_id;
console.log('🚀 ~ checkout', Shopify.checkout);

async function fetchStore(shop) {
  let response = await fetch(`${window.BURL}/ext/store?shop=${shop}`);

  console.log(response.status); // 200
  console.log(response.statusText); // OK

  if (response.status === 200) {
    let data = await response.json();
    return data;
  }
}

async function gsPost(path, msg) {
  const rawResponse = await fetch(`${window.BURL}/ext/${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(msg),
  });
  const content = await rawResponse.json();

  console.log(content);
  return content;
}

function injectStyleSheet(url) {
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.crossorigin = 'anonymous';
  style.href = window.BURL + '/public/' + url;

  document.head.appendChild(style);
}
function addLeftBlock() {
  leftBlock = document.createElement('div');
  leftBlock.className = 'groupshop_left-block';
  leftBlock.innerHTML = `<h3>Get up to <strong><span id="gscashback">...</span> cashback</strong> when you invite your friends to shop</h3><div class="glider-contain">
  <div class="glider">
    <div class="image-placeholder">
        <h4>...</h4>
    </div>
    <div class="image-placeholder">
        <h4>...</h4>
    </div>
    <div class="image-placeholder">
        <h4>...</h4>
    </div>
    <div class="image-placeholder">
        <h4>...</h4>
    </div>
  </div>

  <button aria-label="Previous" class="glider-prev">«</button>
  <button aria-label="Next" class="glider-next">»</button>
  
</div>
<div class="get-start-thank-wrap">
  <div class="image-placeholder" style="height: 40px !important;"> .</div>
</div>
<div class="powerby mont">Powered by <a class="ty-share-this-deal" href="javascript:void(0)"><img src="https://app.groupshop.co/images/GROUPSHOP-logo.svg"></a></div>`;

  var target = document.querySelector('.content-box:first-child');
  target.prepend(leftBlock);
}

function addRightBlock(brandName) {
  const rightBlock = document.createElement('div');
  rightBlock.innerHTML = `<div class="groupshop_right-block">
  <div  class="gs_brandbar">
  <div class="gs_branding"></div>
  </div>
  <p class="gs_content">Earn up to <strong class="bold"><span id="gscashback">...</span> cashback </strong> and access <strong class="bold">exclusive discounts</strong> every time you shop with friends! <img src="https://beta.groupshop.co/images/3-frnd-icon.svg"></p><p style="font-size: 14px;line-height: 18px;text-align: center;letter-spacing: 0.5px;color: #000000;padding: 0 12px;margin-bottom: 25px;font-family: Mulish;font-weight: 400;">Thanks to your ${brandName} purchase, you unlocked 🔑 access to a personalized shop for you and your friends.</p><div style="margin: auto;width:100%; text-align: center;"><a id="gs_link" style="color:#fff;background: #000;padding: 15px 30px;border-radius: 5px;display: inline-block;font-size: 14px;font-weight: 600;margin-bottom: 10px;font-family: DM Sans, sans-serif;letter-spacing: 1px;" target="_blank">CHECK OUT YOUR GROUPSHOP</a></div></div>`;
  var target = document.querySelector('.order-summary__sections');
  target.append(rightBlock);
}

async function init() {
  //   try {
  // fetch store detail
  const store = await fetchStore(Shopify.shop);
  console.log('🚀 ~ file: groupshop-pdp.js ~ line 124 ~ init ~ store', store);
  if (store.status === 'Active') {
    //create products slider
    injectStyleSheet('gsthanks.css');
    injectStyleSheet('glider.min.css');

    addLeftBlock();
    addRightBlock(store.brandName);

    var glider = new Glider(document.querySelector('.glider'), {
      //   slidesToScroll: 3,
      slidesToShow: 'auto',
      slidesToScroll: 0.5,
      itemWidth: 110,
      duration: 0.25,
      rewind: true,
      arrows: {
        prev: '.glider-prev',
        next: '.glider-next',
      },
    });

    gsPost('member', { orderId }).then(({ activeMember: mem, url }) => {
      let cashback = 0;
      if (mem.role === 0) {
        cashback = Shopify.checkout.subtotal_price * 0.5;
      } else {
        cashback =
          Shopify.checkout.subtotal_price *
          (parseFloat(store.discount) / 100 - mem.availedDiscount / 100);
      }
      document.querySelectorAll('#gscashback').forEach((elem) => {
        console.log(elem);
        elem.innerHTML = `$${cashback.toFixed(2)}`;
      });
      window.GSURL = window.FURL + url;
      document.querySelector(
        '.get-start-thank-wrap',
      ).innerHTML = `<div class="get-start-wrap"><a target="_blank" href="${window.GSURL}">Get Started</a></div>`;
      document.getElementById('gs_link').setAttribute('href', window.GSURL);
    });

    const products = await gsPost('products', {
      campaignId: store.campaignId,
    });

    // var glider = Glider(this);
    console.log(products);
    Array(3).map((v, indx) => glider.removeItem(0));
    glider.removeItem(0);
    glider.removeItem(1);
    glider.removeItem(0);
    glider.removeItem(0);
    randomIndx = Math.floor(Math.random() * (products.length - 10)) + 1;
    displayProd =
      products.length > 10
        ? products.slice(randomIndx, randomIndx + 11)
        : products;

    displayProd.map((prod) => {
      const slide = document.createElement('a');
      slide.href = window.GSURL;
      slide.target = '_blank';
      slide.className = 'gscard';
      slide.innerHTML = `<img src="${
        prod.featuredImage
      }"alt="img"><span class="discount">${
        store.discount
      } OFF</span><h4>${prod.title.slice(0, 15)}..</h4><span class="bold">$${(
        prod.price -
        (parseFloat(store.discount) / 100) * prod.price
      ).toFixed(2)}</span> <del>$${prod.price}</del>`;
      glider.addItem(slide);
      glider.refresh(true);
      return prod;
    });

    //   console.log(cards.spit(','));
    //   document.querySelector('.glider').innerHTML = cards;

    glider.refresh(true);
    //   glider.destroy();
  }
  //   } catch (err) {
  //     console.log(JSON.stringify(err));
  //   }
}

init();
