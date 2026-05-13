from PIL import Image
import os

input_path = r'd:\work\Dozoo\dozoo\assets\favicon.png'
output_path = r'd:\work\Dozoo\dozoo\assets\favicon.png'

# iOS 图标规范尺寸
# 60x60 @3x = 180x180 (iPhone)
# 76x76 @2x = 152x152 (iPad)
# 83.5x83.5 @2x = 167x167 (iPad Pro)
# 1024x1024 = App Store

target_size = 180  # 使用 iPhone 的 60pt @3x 尺寸

try:
    with Image.open(input_path) as img:
        print(f"Original size: {img.size}")
        img = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
        img.save(output_path, 'PNG')
        print(f"Resized to {target_size}x{target_size} (iOS 60pt @3x) successfully")
except Exception as e:
    print(f"Error: {e}")
