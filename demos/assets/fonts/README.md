# 示例字体（OFL 开源字体，共 3 款）

三个宿主示例的模板声明了这三款字体，浏览器渲染与出纸需要字体文件可访问。
每个宿主工程从自己的 `public/fonts/` 静态目录按 `/fonts/<文件名>` 提供（路径原样可用）。

字体单个 1.5~8MB，不入各工程 `public/fonts/`（`.gitignore` 已排除）；统一收在本目录，跑 demo 前拷贝：

```bash
# 以 vue3 为例（vue2 / react / jquery 同理）
cp demos/assets/fonts/*.ttf demos/apps/vue3/public/fonts/
```

| 字体 | 来源与许可 |
| --- | --- |
| MaShanZheng-Regular.ttf | 马善政毛笔楷书，OFL（SIL Open Font License） |
| ZCOOLKuaiLe-Regular.ttf | 站酷快乐体，OFL |
| ZCOOLQingKeHuangYou-Regular.ttf | 站酷庆科黄油体，OFL |

业务项目集成时用自己拥有版权/授权的字体替换即可，示例模板不强制使用这三款。
