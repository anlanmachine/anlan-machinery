# 两站数据库免费方案审计报告

审计时间：2026-10-31（Asia/Shanghai）。本次为代码、配置只读审计及独立分支低风险修复；没有生产部署、数据库迁移、生产数据写入或套餐升级。

## 1. 已确认事实与证据边界

| 项目 | Aolan Machinery | Clica Shop TL |
|---|---|---|
| GitHub | anlanmachine/anlan-machinery，生产分支 main | Vercel link=null；本地 Git 无 remote，未取得可核对的 GitHub URL |
| 当前生产源码标识 | 4aa0e6d | Vercel CLI 部署元数据 30ae884；本地 HEAD 0d6dfb4 相比该提交仅增加验收文档/脚本，没有业务代码差异 |
| Next.js | 本地锁定 15.5.19 | 本地安装 15.5.24；Prisma 6.19.3 |
| Vercel | Next.js；项目设置 Node 20.x，但 package.json engines=24.x，配置存在不一致，未擅自调整 | Next.js，Node 24.x，区域 sin1 |
| Vercel Cron | definitions=[] | definitions=[] |
| Git 部署方式 | 已连接 GitHub | CLI 手动部署 |
| 连接客户端 | @neondatabase/serverless 的 neon() HTTP 查询 | Prisma PostgreSQL 客户端，模块级复用实例 |
| 本地生产配置 | .env 指向 ep-tiny-hill-ain8ib8i 的 pooled endpoint，数据库 neondb | 原始项目 .env 指向相同 endpoint 和 neondb |
| 线上生产连接 | DATABASE_URL 是 sensitive，不可回读 | DATABASE_URL 是 sensitive，不可回读 |
| 已核实的预览库 | 未发现该项目绑定 Marketplace 数据库 | 项目 odd-block-76791450，ep-little-bar-b37wduu9，新加坡，已核实 Vercel preview 环境变量 |
| 当前主库状态 | 本地已配置主库只读连接返回 Neon 402 | 相同本地生产 endpoint；不能用本地值替代线上变量证明 |

**共用情况结论：两个本地生产配置确定共用同一 endpoint 和数据库；线上生产是否仍保持该配置，证据不足以百分之百确认。** 不同 host 也未必代表不同 Neon project（可能是不同 branch）；本次仅对独立 preview 获取到明确 project ID。未通过写入探针、部署诊断接口或导出敏感配置来强行确认。

主库 402 返回的是通用 quota exceeded，不能仅凭它确定耗尽的是 CU-hours、网络流量还是其他额度。当前主库容量、真实业务记录数、当月 CU-hours、重置时间均为 **UNKNOWN**；需要 Neon Usage 页面核实。没有把 JSON fallback 40 件商品当成生产商品数量。

预览库只读事务统计：database_bytes=10,846,208，约 10.35 MiB；Product 约 164 行、ProductVariant 约 203 行（pg_stat 估计值，非精确生产计数）；采样仅见本次查询的 1 个 active connection；未启用 pg_cron 或 pg_stat_statements。该结果不能外推为主库容量或月用量。

Vercel 一小时 CDN 日志样本：Clica 返回 0 条，Aolan 返回 68 条。样本/可见性不足，不能据此断言没有机器人、监控或其他时段访问。

单次线上只读探测：Clica /api/health 返回 503；Aolan /api/products 本机请求超时，不能据此判定全球访问均失败。没有循环探测或生成测试订单。

## 2. 哪些访问可能消耗资源

### 已在代码确认

- Clica /api/health 每次执行 SELECT 1。若外部监控间隔少于 5 分钟，会不断触发数据库活动；**未证明现在确实存在这种外部监控**。
- Clica 首页同时调用四组商品查询，另外读取分类、Banner 和站点设置；RootLayout 与首页重复读取站点设置。动态 headers/cookies 使整个页面不能简单全站静态化。
- Clica 商品详情 metadata 和页面重复读取同一 slug。商品列表已有每页 16 条，不应为了“优化”退回全量加载。
- Clica 登录态校验会查数据库；登录用户购物车挂载时读取、修改后 300ms 防抖保存。这是事件驱动，不是周期性轮询。保留它以保护登录、订单和跨设备购物车。
- Aolan 公共页面大量 force-dynamic，/api/products 为 no-store。迁移表模式每次完整 catalog 读取通常需要查表存在、count、商品、图片四次查询，详情 metadata 与页面可再重复。
- Aolan readCollection 原先在每个冷进程的第一次读取中执行两条 CREATE TABLE IF NOT EXISTS；公共只读访问不应承担 DDL 初始化。
- Aolan admin-dashboard 生产版本进入时加载全部模块，保存后重新加载全部模块。V3 分支已另做按需加载，但尚未合并，不能算作线上已节省。
- Aolan media_files 用 bytea 保存图片/视频；冷 CDN 未命中时从数据库读取并 base64 编解码。现有响应已设长期 public immutable 缓存，因此**不是每次用户看图片都会查询数据库**。
- Aolan 每次商品修改先保存整本 catalog backup，再保存版本；全量备份、版本及媒体会增加存储/WAL。不能为省钱删除现有备份。
- 开发机生产 .env、旧部署及预览若复用生产连接，也可能唤醒主库。当前 Clica 的新预览已独立，但旧部署和所有外部工具未能穷尽核实。

### 未发现或未能证实

业务源码未发现 setInterval/refetchInterval 周期数据库轮询；两个 Vercel 项目无 Cron 定义。测试脚本的等待重试和 UI 提示消失 setTimeout 不等于生产轮询。没有发现代码运行逻辑复制或持续 keepalive。Prisma 复用连接本身不是持续运行的 SQL，不能把所有连接池直接认定为 CU 超额根因。主库无法读取 pg_stat_activity/扩展状态，历史慢查询及外部监控仍未知。

## 3. 本次提交的低风险修改（未部署）

### Aolan
- getCatalog 使用 React 请求级 memoization，metadata/同次服务端渲染共用读取；不跨请求保存产品状态，下一请求仍读当前商品。
- productSpecifications 复制参数对象再补充字段，避免污染共享的请求结果。
- readCollection 移除读取时的 schema DDL；写入/上传初始化路径保留。
- 新增 /api/live，仅检查进程存活，明确 database=not-checked，不访问 Neon。
- 新增只读 SQL 容量/连接审计脚本，不输出客户行、凭证或完整连接串。

### Clica
- 仅对公开站点设置、已发布分类和 Banner 使用 Next Data Cache，TTL 3600 秒。
- 分类/Banner/站点设置后台保存成功后立即 revalidateTag，后续访问读取新内容。
- 失败在缓存函数外处理，不把 fallback 或失败结果当成成功数据缓存。
- 站点设置及商品详情增加 React 请求级去重。
- 新增 /api/live；保持原 /api/health 深度诊断语义不变。外部监控需要改用 /api/live 才会减少健康检查的数据库唤醒；本次没有自行修改未知监控服务。

**未共享缓存**：用户、登录会话、订单、购物车、付款凭证、管理员业务数据；库存、结算价格及付款方式继续实时读取。未更改商品规格、下单事务、付款凭证加密、权限校验、登录/退出语义。

这一轮不会保证自动休眠：Aolan 其他公共查询和 Clica 实时商品/登录请求仍能唤醒数据库。请求去重降低重复 SQL，而 CU-hours 主要取决于计算规格乘以活跃时间，不能将 SQL 减少比例直接当成账单下降比例。

## 4. 下一轮可优化项（尚未执行）

1. 确认所有外部 uptime/健康监控改查 /api/live；深度 DB 检查仅人工按需。不要为 Supabase 或 Neon 写保活 Cron。
2. Aolan 商品救援和来源问题解决后，建立仅含 Published 公开字段的跨请求 catalog 缓存；所有增删改、恢复、导入路径统一失效。不能缓存 fallback 冒充数据库成功。
3. 工厂、案例、博客、公开画廊做同类缓存或发布快照。查询用户、订单和凭证的页面不得整页 public cache。
4. Clica 公共商品展示可与实时库存/购买校验分离：可缓存名称、图片、描述与规格；结算仍核验最新售价和库存。需要额外测试缓存失效、下架、规格编辑、库存变化，故本次未贸然更改。
5. sitemap 只查询 published slug/updatedAt，不加载所有商品规格/variants；后台列表采用服务器分页、字段投影和按需详情。
6. Aolan 照片视频后续改对象存储并使用 CDN，数据库保存元数据。**属于存储迁移，需要备份、链接兼容和明确批准，未执行。** Clica 现有公开图片 Cloudinary 保持不动，付款凭证不能改为公开图片 URL。
7. 全量 catalog 备份保留策略须先有外部可恢复副本，再由用户批准；单商品版本与批量全量备份职责分开，不能直接删历史记录。
8. 核实开发/预览/旧部署的连接分离；不改变目前生产 DATABASE_URL。

## 5. 免费方案比较

按 2026-10-31 官方公开页面：

| 项目 | Neon Free | Supabase Free |
|---|---|---|
| 公开数据库容量 | 当前 pricing 列 1 GB/project | 500 MB/project |
| 计算 | 100 CU-hours/project/月 | 共享 CPU、500 MB RAM；没有相同 CU-hours 计费模型 |
| 休眠 | 无活动 5 分钟自动休眠，查询自动唤醒 | 约 7 天低活动暂停；需关注控制台恢复流程，不等同 Neon 秒级自动唤醒 |
| 网络/文件 | 公开网络传输 5 GB/project/月；pricing 另列对象存储 5 GB，但本项目没有接入它 | 5 GB egress、5 GB cached egress，文件存储 1 GB |
| 免费项目 | 当前 pricing 列 100 projects | 最多 2 个 active Free projects |
| Clica 迁移 | 不需更换驱动 | Prisma PostgreSQL 原理兼容；需验证 pooler、事务、迁移工具、扩展、凭证和性能 |
| Aolan 迁移 | 当前 neon() HTTP 直接可用 | 不能只换 URL：Neon HTTP driver 不是通用 Supabase TCP 客户端；cms-store 虽有 Supabase 分支，但 product-store/media route 仍直接用 Neon，需完整适配 |
| 风险 | 若持续活跃，计算额度仍会不足；存储/流量也有上限 | 更小 DB 容量、休眠恢复、连接池兼容、驱动改造、RLS/私密文件权限风险 |

来源：
- https://neon.com/pricing
- https://neon.com/docs/introduction/scale-to-zero
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/kb/guides/migrate-from-neon

部分 Neon 历史文档仍写 0.5 GB，本报告采用今日 pricing 的 1 GB；**当前账户实际适用额度必须以控制台为准**。预览库约 10.35 MiB 不代表生产库也能装进 Supabase 500 MB。

建议先保留 Neon，纠正无效唤醒与公开数据读取，再依据 7–14 天实际 CU/存储/流量作决定。现在直接搬到 Supabase既不能保证免费，也会引入额外数据与兼容风险。

## 6. 0 美元可行性：条件估算，不是实测承诺

假设只有一个 0.25 CU compute：
- 30 天全天运行：0.25 × 24 × 30 = 180 CU-hours，超过 100。
- 每天活跃 4 小时：约 30 CU-hours/月。
- 每天活跃 8 小时：约 60 CU-hours/月。
- 每天活跃 12 小时：约 90 CU-hours/月。
- 100 CU-hours 对应 400 活跃小时，即 30 天约 13.3 小时/天；31 天约 12.9 小时/天。扩容到 0.5 CU、多个活跃 computes/branches 会更快消耗。
- 若一个公开缓存每小时才重查一次、每次只产生约 5 分钟活跃尾段，理想单查询源约 15 CU-hours/30天；**多个不同时间失效的缓存、真实买家请求、机器人和管理员操作会叠加，不能套用为两站实际账单**。
- 仅设置 5 分钟缓存很可能让数据库刚要睡眠就被再次唤醒，不足以确保免费。

因此：**数据库继续每月 $0 有条件可行，但当前无法保证。** 需确认当月 402 的具体额度、当前 compute size、生产容量与长期流量。不可通过删除订单、凭证、商品、备份来满足免费限额。

还有独立限制：本次实查 Vercel 团队 plan=hobby。官方 Hobby 限定非商业个人使用；两站分别是商店和外贸业务网站，不能承诺它们在 Vercel Hobby 上合规长期零费用。数据库免费不代表整体商业托管免费。
来源：https://vercel.com/docs/plans/hobby

## 7. 若后续批准迁移：备份、验收、回滚门槛

本次没有迁移，也没有声称已创建可用的完整生产备份。主库 402 未解决前，迁移禁止开始。

1. 来源确认：在控制台确认两个正式站的 Neon project/branch/database，确认是否共享。冻结任何清理、seed、重建计划。
2. 一致性备份：使用只读、一致快照的 pg_dump 自定义格式，包含 schema、数据、序列、约束、枚举、函数和 bytea；使用直接连接/适合备份的 session 连接。保存工具版本、时间、退出码、归档清单和 SHA-256。不得使用清空源库命令。
3. 备份边界：包括两站全部业务表、cms_store、products、product_images、product_versions、cms_backups、media_files、Prisma migrations、订单及付款记录；Cloudinary/其他对象文件另列清单、下载副本与校验和。数据库备份不自动包含外部媒体。
4. 密钥：AUTH_SECRET、付款凭证加密密钥等以独立加密渠道保存；不放入 GitHub、报告或公开压缩包。保持加密密钥才能读取旧付款凭证。
5. 可恢复证明：在隔离的本地/测试 Postgres 恢复，验证表/精确行数、主键 ID、slug、外键、序列、规格 JSON、订单金额/币种、图片 bytea hash、私密凭证可解密。记录关键表按主键排序的分块校验和。
6. 新服务演练：不连接正式域名，测试注册/登录/退出、购物车、订单、库存并发、付款凭证重试/权限隔离、后台修改及回收站/版本/备份。验证所有匿名角色不能读用户/订单/凭证。
7. 维护窗口：如果确认共享数据库，两站写入口需要一起短暂停写；前台公开展示尽可能保留。最终增量同步/快照后复核源目标。工程预估小型已演练库约 30–60 分钟只读窗口，但生产大小未知，实际要以完整演练测时为准；Aolan 驱动改造可能需更长开发时间。
8. 明确批准：向用户提供备份 SHA、还原日志、校验报告、预计窗口和回滚方案后，再取得明确切换批准。
9. 回滚：保留旧库和旧部署。若新库尚无业务写入，可恢复旧连接并回滚部署；若已有新订单/上传，先停写、导出并对账回灌增量，不能简单换回旧 URL 丢掉新订单。设定行数/金额/附件错误即暂停放量的门槛。
10. 未经另行批准，不删除旧库、旧备份、旧部署或历史图片。

## 8. 测试与交付

- Aolan：8 项测试通过；typecheck、build 通过；lint 无错误，7 条已有警告。
- Clica：99 项单元/集成测试通过；typecheck、lint 通过。构建遇 Google Fonts Inter 的 TLS/ECONNRESET 网络错误；未关闭 TypeScript/ESLint，也未伪造构建成功。
- 新缓存测试使用隔离模拟存储验证去重、失效、失败后重试、TTL 和数据范围；不是生产缓存命中率证明。
- 生产登录/下单/付款/上传写入回归没有执行；本次避免测试订单或凭证污染生产库。
- Aolan 独立优化分支基于已上线 main，不包含未完成 V3。Clica 独立本地分支，不创建未知 GitHub 仓库。
- 未部署这些优化，因此不能声称线上 CU 已下降。无持续监控/保活任务被创建。

