import { mihomoconfig, singboxconfig, getFakePage, configs, base64DecodeUtf8 } from './index.js';

import Koa from 'koa';
import Router from '@koa/router';

const app = new Koa();
const router = new Router();

// 环境变量配置
const backimg = 'https://t.alcy.cc/ycy';
const subapi = 'https://url.v1.mk';
const mihomo = 'https://raw.githubusercontent.com/Kwisma/cf-worker-mihomo/main/Config/Mihomo_lite.yaml';
const beiantext = base64DecodeUtf8('6JCMSUNQ5aSHMjAyNTAwMDHlj7c=');
const beiandizi = atob('aHR0cHM6Ly90Lm1lL01hcmlzYV9rcmlzdGk=');

router.get('/', async (ctx) => {
  const url = new URL(ctx.request.href);
  const userAgent = ctx.request.headers['user-agent'];
  const isBrowser = /meta|clash.meta|clash|clashverge|mihomo|singbox|sing-box|sfa/i.test(userAgent);
  const templateUrl = url.searchParams.get("template");
  const singbox = url.searchParams.get("singbox");
  const IMG = process.env.IMG || backimg;
  const sub = process.env.SUB || subapi;
  const Mihomo_default = process.env.MIHOMO || mihomo;
  const beian = process.env.BEIAN || beiantext;
  const beianurl = process.env.BEIANURL || beiandizi;

  // Handle URL parameters
  let urls = url.searchParams.getAll("url");

  if (urls.length === 1 && urls[0].includes(",")) {
    urls = urls[0].split(",").map(u => u.trim()); // Split and trim spaces
  }

  if (urls.length === 0 || urls[0] === "") {
    ctx.body = await getFakePage(IMG, beianurl, beian, configs());
    ctx.type = 'html';
    return;
  }

  if (!isBrowser) {
    ctx.body = '不支持的客户端';
    ctx.status = 400;
    ctx.type = 'html';
    return;
  }

  try {
    let res, data, headers, status;
    if (singbox) {
      res = await singboxconfig({ urls, templateUrl, subapi });
    } else {
      res = await mihomoconfig({ urls, templateUrl, configUrl: Mihomo_default });
    }

    data = res.data;
    headers = new Headers(res.headers || {});
    status = res.status;
    headers.set("Content-Type", "application/json; charset=utf-8");
    
    ctx.body = data;
    ctx.status = status;
    ctx.set(headers);
  } catch (err) {
    ctx.body = err.message;
    ctx.status = 500;
    ctx.type = 'json';
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

export default app.callback();