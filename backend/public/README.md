# 静态文件说明

## 文件夹结构

```
public/
├── images/      # 图片资源
├── audio/       # 音频资源
└── videos/      # 视频资源
```

## 使用方式

### 1. 放置文件

把文件放到对应文件夹：

```
public/
├── images/
│   ├── story1-cover.jpg
│   └── banner.png
├── audio/
│   ├── story1.mp3
│   └── background-music.mp3
└── videos/
    └── intro.mp4
```

### 2. 数据库中存储路径

在数据库中存储相对路径，例如：

- `/images/story1-cover.jpg`
- `/audio/story1.mp3`

### 3. 前端访问地址

通过后端 API 访问：

```
http://localhost:3000/api/v1/images/story1-cover.jpg
http://localhost:3000/api/v1/audio/story1.mp3
```

### 4. 前端使用示例

```typescript
const baseUrl = 'http://localhost:3000/api/v1/';
const imageUrl = `${baseUrl}/images/story1-cover.jpg`;
```

## 支持的文件格式

| 类型 | 格式                        |
| -- | ------------------------- |
| 图片 | jpg, jpeg, png, gif, webp |
| 音频 | mp3, wav                  |
| 视频 | mp4                       |
| 其他 | 任意格式（作为二进制下载）             |

