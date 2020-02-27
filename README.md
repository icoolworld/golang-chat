# 基于 golang 实现的匿名聊天

## 后端技术栈

- golang
- goim
- kafka
- discovery 服务发现
- gin
- redis

## 前端技术栈

- vue
- websocket

## 如何运行

> 运行 golang 后端

```
cd ./chat-golang-backend/
docker-compose up -d
```

> 运行前端 UI

```
cd ./chat-golang-frontend/
yarn install
npm run dev
```

## 效果图

![demo](./docs/chat.png)
