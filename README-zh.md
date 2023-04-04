<div align="center">

<img width="150px" src="src/assets/openai-rs.png" alt="openai-rs"/><h1 style="font-size: 5em; margin: 0;">GPTPal</h1>

</div>

<div align=center>

Chat with GPTs just like chatting with your many friends.

[English](README.md) | [中文](README-zh.md)

</div>

![Cirrus CI - Base Branch Build Status](https://img.shields.io/cirrus/github/openai-rs/gptpal?style=flat-square)
![GitHub](https://img.shields.io/github/license/openai-rs/gptpal?style=flat-square)


ChatGPT API桌面版, 可同时与多个GPT聊天。可同步Prompts, 支持Prompt联想。本地存储对话记录。可配置代理。

---

<div align=center>
<img width="745px" height="540px" src="src/assets/gptpal.gif" />
</div>

## Features

<div align=center>

| Feature | Progress | Description |
| ------ | ------ | ------ |
| 同时与多个GPT聊天 | ✔️ | 不需要等待, 与多个GPT同时聊天, 新消息提醒 |
| 本地对话记录 | ✔️ | 对话记录保存在本地, 可清理 |
| 同步更新 Prompts | ✔️ | 可从 [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts#prompts) 仓库同步最新Prompts |
| Prompts 输入提示 | ✔️ | 输入 '/' 提示相关Prompts, TAB选择 |
| Markdown 渲染 | ✔️ | 渲染Markdown语法 |
| 代码块渲染 | ✔️ | 高亮代码块, 支持复制代码 |
| 记忆窗口状态 | ✔️ | 记忆上次关闭的窗口大小及位置, 自动恢复 |
| API 配置 | ✔️ | 配置API的 key, organization, url, proxy |
| Model 配置 | ✔️ | 选择模型, 配置模型请求参数 |
| 代理配置 | ✔️ | 配置 API 使用的代理 |
| 钉选 prompts | ✔️ | 自定义钉选 prompts |
| 语言选择 | 🚧 | 选择回复语言 |
| Token 优化 | 🚧 | 优化token使用 |
| Token 用量 | 🚧 | 检查token用量 |
| 多平台 | 🚧 | 支持 Windows, Macos, Linux |
| 主题 | 🚧 | 更改主题样式 |
| 修改标题 | 🚧 | 修改对话主题 |
| 声音输入 | 🚧 | 语音聊天 |
| Prompts 管理 | 🚧 | Prompts crud, pin |

</div>

## 安装

1. Releases 页面下载

2. 安装

3. 启动

## 使用

### Basic

1. 启动应用

2. 点击左下角 `API settings` 按钮打开 API 配置.

    a. 设置你的 [API key](https://platform.openai.com/account/api-keys), 如果想使用环境变量, 则系统配置 `OPENAI_API_KEY` 环境变量, 然后此处留空即可

    b. 可选, 设置你的组织

    c. 可选, 设置代理, 例: http://127.0.0.1:7890

    d. 保存

3. 与 GPT 聊天

### Prompts

1. 点击主页右下角 'sync' 按钮可从 [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts/blob/main/README.md) 同步 prompts.

2. 输入 `'/'` 即可获取相关prompts建议, 按 `Tab` 选择 prompt

3. 点击 📌 可以钉选 prompt

    <img width="745px" height="540px" src="src/assets/pin-prompt.png" />

### 配置模型

点击左下角 `Model settings` 按钮可配置 max_tokens, temperature, presence_penalty 和 frequency_penalty.

- max_tokens: 整数，可选，默认为 无穷大

> 生成聊天完成时的最大 token 数量。 输入 token 和生成的 token 的总长度受模型上下文长度的限制。

- temperature: 数字，可选，默认为 1

> 随机性，介于 0 和 2 之间。较高的值（如 0.8）会使输出更加随机，而较低的值（如 0.2）则会使其更加聚焦和确定性。

- presence_penalty: 数字，可选，默认为 0

> -2.0 到 2.0 之间的数字。正值会惩罚新 token，根据它们是否已出现在文本中，增加模型谈论新话题的可能性。

- frequency_penalty: 数字，可选，默认为 0

> -2.0 到 2.0 之间的数字。正值会惩罚新 token，根据它们在文本中的现有频率，减少模型重复相同行的可能性。
