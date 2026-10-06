# Color Clash 黑客松提交草稿

## 填写到 Avalanche Builder Hub

**Project Name:** Color Clash

**Short Description:** 一款支持四人在线匹配的漫画像素风卡牌游戏。Avalanche Fuji 合约记录排位赛胜负，玩家可以用钱包查看可验证的战绩。

**Track:** Open Innovation Track（开放创新）

**Full Description:**

Color Clash 是一款可在浏览器游玩的多人卡牌游戏。玩家可以创建像素角色，与三名电脑玩家练习，或进入四人快速匹配。游戏服务器私下发牌并校验出牌规则，游戏结束后保存战绩。连接钱包的玩家通过签名证明地址所有权；签名不花费 AVAX。四人排位赛结束后，服务器用专用 Fuji 测试钱包将比赛编号、赢家标识和参与钱包地址提交到 Avalanche Fuji 合约。玩家姓名和手牌留在服务器，不写入链上。合约公开记录胜场、负场和赛果交易，方便玩家核查。

游戏提供角色编辑器、卡背收藏、音乐和多语言界面。游戏币仅用于购买外观，保存在服务器，不是加密货币。游戏没有下注。出牌、公平洗牌和判定仍由游戏服务器负责；链上记录证明赛果已提交，不证明服务器一定公平。

**Avalanche 使用证据：**

- 网络：Avalanche Fuji C-Chain，chain ID 43113
- [GameResults 合约](https://testnet.snowtrace.io/address/0x9B73a197d10aD99d5f6135970B6E27C1b45701BF)
- [四人快速匹配赛果交易](https://testnet.snowtrace.io/tx/0x20ed43cfa4d8ae0f5da77c03596173e05795c6b55a0be8d1f90b0e41b582db95)
- 链上结果：4 名玩家，测试钱包记录 1 胜、3 负

**How it's made:** 浏览器客户端使用 Vite、原生 JavaScript、CSS 和 Web Audio。多人对局由 Node.js 与 WebSocket 服务端管理洗牌、私有手牌、出牌计时、UNO 喊牌、+4 质疑和规则校验。钱包使用免 Gas 签名证明地址所有权。Avalanche Fuji C-Chain 上的 Solidity GameResults 合约记录排位赛编号、赢家和参与钱包地址；专用测试钱包提交赛果并支付 Gas。比赛明细、外观和商店金币保存在链下。

**Tech stack:** Solidity、Node.js、Vite、JavaScript、WebSocket、ethers.js。

**Pre-existing idea disclosure:** Color Clash 借鉴已有的 UNO 类配色卡牌玩法。本次活动期间制作了漫画像素界面和素材、角色编辑器、外观商店、电脑对战、WebSocket 多人规则引擎、出牌时钟和动效、钱包签名登录、比赛记录、GameResults 合约、Fuji 部署与真实四人赛果验证。卡牌玩法概念并非本次活动首创。

## 提交前必须补齐

- [ ] 在 [Luma 报名页](https://luma.com/umdyirg3)确认自己已获批准加入活动。
- [ ] 将项目代码发布到 [公开 GitHub 仓库](https://github.com/MAGIC-MJK/color-clash-avalanche)，填入仓库链接。
- [ ] 部署可从互联网访问的 HTTPS 游戏地址；本机 `127.0.0.1` 不能作为评委试玩链接。托管服务须同时支持网页和 WebSocket，并安全配置服务端录入钱包、持久存储。
- [x] 已准备 [路演幻灯片](submission/Color-Clash-Pitch-v6.pptx)；提交时将这个文件上传。
- [ ] 录制简短演示视频或提供备用截图，供评委无法同时凑齐四名玩家时查看快速匹配。
- [ ] 在 [Builder Hub 提交页](https://build.avax.network/events/project-submission?event=093982ed-7037-4765-a066-56a5d3cff8cb)填写项目介绍、赛道、团队信息，并上传 GitHub、幻灯片和演示资料；最终确认提交状态。

## 两分钟演示顺序

1. 展示首页、角色编辑和单人练习，说明无需钱包也能玩。
2. 展示四人快速匹配和服务端校验规则，说明其他玩家看不到手牌。
3. 展示钱包签名、战绩页面和 Fuji 赛果交易。
4. 说明外观币在服务器，比赛胜负在 Fuji；没有下注，洗牌与判定仍依赖服务器。

## 时间提醒

活动页面写“北京时间 2026 年 10 月 8 日 05:59 截止”，Luma 页面写“2026 年 10 月 7 日 23:59 截止”。按较早的 **10 月 7 日 23:59** 完成提交，避免页面间的时间差。
