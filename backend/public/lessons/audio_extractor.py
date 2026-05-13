import os
import sys
import subprocess
import argparse
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def extract_audio_from_video(video_path: str) -> bool:
    """
    从视频文件中提取音频轨道并转换为MP3和WAV格式
    
    Args:
        video_path: 视频文件的路径
        
    Returns:
        bool: 成功返回True，失败返回False
    """
    video_path = os.path.abspath(video_path)
    
    if not os.path.exists(video_path):
        print(f"错误：文件不存在 - {video_path}")
        return False
    
    if not os.path.isfile(video_path):
        print(f"错误：路径不是文件 - {video_path}")
        return False
    
    directory = os.path.dirname(video_path)
    filename = os.path.basename(video_path)
    name_without_ext = os.path.splitext(filename)[0]
    
    mp3_output = os.path.join(directory, f"{name_without_ext}1.mp3")
    wav_output = os.path.join(directory, f"{name_without_ext}1.wav")
    
    print(f"源视频文件: {video_path}")
    print(f"输出目录: {directory}")
    print(f"输出MP3: {mp3_output}")
    print(f"输出WAV: {wav_output}")
    
    try:
        print("\n正在提取音频并转换为MP3格式...")
        mp3_command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',
            '-acodec', 'libmp3lame',
            '-q:a', '0',
            '-y',
            mp3_output
        ]
        result = subprocess.run(mp3_command, check=True, capture_output=True, text=True)
        print("MP3转换完成")
        
        print("\n正在转换为WAV格式...")
        wav_command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            '-y',
            wav_output
        ]
        result = subprocess.run(wav_command, check=True, capture_output=True, text=True)
        print("WAV转换完成")
        
        print("\n✅ 音频提取成功！")
        print(f"MP3文件: {mp3_output}")
        print(f"WAV文件: {wav_output}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ 转换失败: {e.stderr}")
        return False
    except FileNotFoundError:
        print("\n❌ 错误：未找到ffmpeg。请确保ffmpeg已安装并添加到系统路径中。")
        print("下载地址: https://ffmpeg.org/download.html")
        return False
    except Exception as e:
        print(f"\n❌ 发生未知错误: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='从视频文件中提取音频轨道并转换为MP3和WAV格式'
    )
    parser.add_argument(
        'video_path',
        nargs='?',
        default=None,
        help='视频文件的路径'
    )
    args = parser.parse_args()
    
    video_path = args.video_path
    
    if not video_path:
        print("请提供视频文件路径作为参数")
        print("用法: python audio_extractor.py <视频文件路径>")
        sys.exit(1)
    
    success = extract_audio_from_video(video_path)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()