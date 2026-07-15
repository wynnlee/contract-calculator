# 合同金额与分期计算器

在线计算合同金额、税额及各期分期款项，支持含税/不含税自动换算、金额中文大写、深色主题切换。

## 功能特性

- **含税单价计算** — 输入含税单价和数量，自动反算不含税金额和税额
- **多期分期** — 自定义付款比例，支持任意多期，含预设模板快速填充
- **中文大写** — 所有金额自动生成财务规范的中文大写（壹贰叁…）
- **一键复制** — 每个金额旁均有复制按钮，数字和大写可分别复制
- **单位切换** — 元 ↔ 万元一键切换，万元模式自动去除尾部多余零
- **深色主题** — 支持浅色/深色主题切换，偏好自动保存

## 技术栈

- **React 18** + **Vite 5**
- **Arco Design** 组件库
- GitHub Pages 部署

## 本地运行

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173/contract-calculator/`

## 在线使用

[https://wynnlee.github.io/contract-calculator/](https://wynnlee.github.io/contract-calculator/)

## License

MIT
