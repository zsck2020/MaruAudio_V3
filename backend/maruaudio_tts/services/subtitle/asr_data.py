"""ASR 数据结构

设计参考: V2 (18884e6) backend/subtitle/asr/asr_data.py
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List


@dataclass
class ASRSegment:
    """ASR 片段（时间戳单位：毫秒）"""

    text: str
    start_time: int
    end_time: int
    translated_text: str = ""

    def to_srt_timestamp(self) -> str:
        return f"{self._ms_to_srt(self.start_time)} --> {self._ms_to_srt(self.end_time)}"

    @staticmethod
    def _ms_to_srt(ms: int) -> str:
        total_seconds, milliseconds = divmod(ms, 1000)
        minutes, seconds = divmod(total_seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{int(hours):02}:{int(minutes):02}:{int(seconds):02},{int(milliseconds):03}"

    def to_vtt_timestamp(self) -> str:
        return f"{self._ms_to_vtt(self.start_time)} --> {self._ms_to_vtt(self.end_time)}"

    @staticmethod
    def _ms_to_vtt(ms: int) -> str:
        total_seconds, milliseconds = divmod(ms, 1000)
        minutes, seconds = divmod(total_seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{int(hours):02}:{int(minutes):02}:{int(seconds):02}.{int(milliseconds):03}"


@dataclass
class ASRData:
    """ASR 结果容器"""

    segments: List[ASRSegment] = field(default_factory=list)

    def __post_init__(self) -> None:
        cleaned = [s for s in self.segments if s.text and s.text.strip()]
        cleaned.sort(key=lambda s: s.start_time)
        self.segments = cleaned

    def __iter__(self):
        return iter(self.segments)

    def __len__(self) -> int:
        return len(self.segments)

    def has_data(self) -> bool:
        return bool(self.segments)

    def to_srt(self) -> str:
        """转 SRT 格式"""
        lines: list[str] = []
        for i, seg in enumerate(self.segments, 1):
            lines.append(str(i))
            lines.append(seg.to_srt_timestamp())
            lines.append(seg.text)
            lines.append("")
        return "\n".join(lines)

    def to_vtt(self) -> str:
        """转 WebVTT 格式"""
        lines: list[str] = ["WEBVTT", ""]
        for seg in self.segments:
            lines.append(seg.to_vtt_timestamp())
            lines.append(seg.text)
            lines.append("")
        return "\n".join(lines)

    def to_ass(self) -> str:
        """转 SubStation Alpha (ASS) 格式

        简化版：使用 Default 样式，仅写时间和文本。
        """
        header = (
            "[Script Info]\n"
            "ScriptType: v4.00+\n\n"
            "[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
            "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
            "Alignment, MarginL, MarginR, MarginV, Encoding\n"
            "Style: Default,HarmonyOS Sans SC,42,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,"
            "0,0,0,0,100,100,0,0,1,2,1,2,10,10,30,1\n\n"
            "[Events]\n"
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        )
        events: list[str] = [header]
        for seg in self.segments:
            events.append(
                f"Dialogue: 0,{self._ms_to_ass(seg.start_time)},{self._ms_to_ass(seg.end_time)},"
                f"Default,,0,0,0,,{seg.text}"
            )
        return "\n".join(events)

    @staticmethod
    def _ms_to_ass(ms: int) -> str:
        total_seconds, milliseconds = divmod(ms, 1000)
        minutes, seconds = divmod(total_seconds, 60)
        hours, minutes = divmod(minutes, 60)
        centi = int(milliseconds // 10)
        return f"{int(hours):d}:{int(minutes):02}:{int(seconds):02}.{centi:02}"

    def to_json(self) -> dict:
        return {
            str(i + 1): {
                "start_time": seg.start_time,
                "end_time": seg.end_time,
                "original_subtitle": seg.text,
                "translated_subtitle": seg.translated_text,
            }
            for i, seg in enumerate(self.segments)
        }

    @classmethod
    def from_srt(cls, srt_content: str) -> "ASRData":
        """从 SRT 文本解析"""
        segments: list[ASRSegment] = []
        lines = srt_content.strip().split("\n")
        i = 0
        ts_pattern = re.compile(
            r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})"
        )
        while i < len(lines):
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                break
            i += 1  # 序号行
            if i >= len(lines):
                break
            match = ts_pattern.match(lines[i])
            if not match:
                i += 1
                continue
            sh, sm, ss, sms, eh, em, es, ems = map(int, match.groups())
            start_ms = (sh * 3600 + sm * 60 + ss) * 1000 + sms
            end_ms = (eh * 3600 + em * 60 + es) * 1000 + ems
            i += 1
            text_lines: list[str] = []
            while i < len(lines) and lines[i].strip():
                text_lines.append(lines[i])
                i += 1
            segments.append(ASRSegment(
                text="\n".join(text_lines),
                start_time=start_ms,
                end_time=end_ms,
            ))
        return cls(segments=segments)

    def save_srt(self, path: str) -> None:
        Path(path).write_text(self.to_srt(), encoding="utf-8")

    def save_vtt(self, path: str) -> None:
        Path(path).write_text(self.to_vtt(), encoding="utf-8")

    def save_ass(self, path: str) -> None:
        Path(path).write_text(self.to_ass(), encoding="utf-8")

    def optimize_timing(self) -> "ASRData":
        """调整相邻片段重叠的时间戳，取中点分割"""
        for i in range(len(self.segments) - 1):
            cur = self.segments[i]
            nxt = self.segments[i + 1]
            if cur.end_time > nxt.start_time:
                mid = (cur.end_time + nxt.start_time) // 2
                cur.end_time = mid
                nxt.start_time = mid
        return self
