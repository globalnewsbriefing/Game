#!/usr/bin/env python3
"""Generate 2D tablet mount drawings from the provided hand sketch.

The source sketch is missing several manufacturing-critical values.  This
generator keeps the interpreted values in one place so the review SVG, profile
SVG, and DXF remain consistent if the client confirms different dimensions.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import cos, pi, sin
from pathlib import Path


OUT_DIR = Path(__file__).resolve().parents[1] / "drawings" / "tablet_mount"


@dataclass(frozen=True)
class Point:
    x: float
    y: float


@dataclass(frozen=True)
class Geometry:
    width: float = 125.0
    height: float = 45.0
    lower_hole_diameter: float = 2.0
    slot_width: float = 2.0
    slot_length: float = 59.0
    slot_angle_degrees: float = 8.0
    material_thickness: float = 2.0


G = Geometry()


def fmt(value: float) -> str:
    return f"{value:.3f}".rstrip("0").rstrip(".")


def cubic(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    steps: int = 12,
) -> list[Point]:
    points: list[Point] = []
    for step in range(1, steps + 1):
        t = step / steps
        mt = 1 - t
        points.append(
            Point(
                (mt**3 * p0.x)
                + (3 * mt**2 * t * p1.x)
                + (3 * mt * t**2 * p2.x)
                + (t**3 * p3.x),
                (mt**3 * p0.y)
                + (3 * mt**2 * t * p1.y)
                + (3 * mt * t**2 * p2.y)
                + (t**3 * p3.y),
            )
        )
    return points


def arc(
    cx: float,
    cy: float,
    radius: float,
    start_degrees: float,
    end_degrees: float,
    steps: int = 24,
) -> list[Point]:
    points: list[Point] = []
    for step in range(steps + 1):
        t = step / steps
        angle = (start_degrees + (end_degrees - start_degrees) * t) * pi / 180
        points.append(Point(cx + radius * cos(angle), cy + radius * sin(angle)))
    return points


def transformed_slot_points(
    center: Point,
    length: float,
    width: float,
    angle_degrees: float,
) -> list[Point]:
    """Return a rounded slot perimeter, clockwise, as points."""

    radius = width / 2
    straight = length - width
    theta = angle_degrees * pi / 180
    ux, uy = cos(theta), sin(theta)
    nx, ny = -sin(theta), cos(theta)
    left = Point(center.x - ux * straight / 2, center.y - uy * straight / 2)
    right = Point(center.x + ux * straight / 2, center.y + uy * straight / 2)

    points: list[Point] = []
    for step in range(12 + 1):
        a = pi / 2 - step * pi / 12
        points.append(
            Point(
                right.x + radius * (cos(a) * nx + sin(a) * ux),
                right.y + radius * (cos(a) * ny + sin(a) * uy),
            )
        )
    for step in range(12 + 1):
        a = -pi / 2 - step * pi / 12
        points.append(
            Point(
                left.x + radius * (cos(a) * nx + sin(a) * ux),
                left.y + radius * (cos(a) * ny + sin(a) * uy),
            )
        )
    return points


def circle_points(center: Point, diameter: float, steps: int = 48) -> list[Point]:
    radius = diameter / 2
    return [
        Point(
            center.x + radius * cos(2 * pi * step / steps),
            center.y + radius * sin(2 * pi * step / steps),
        )
        for step in range(steps)
    ]


def outline_points() -> list[Point]:
    """Interpreted outside cutting profile from the hand sketch."""

    points = [
        Point(0, 0),
        Point(95, 0),
    ]
    points += cubic(
        Point(95, 0),
        Point(113, 0),
        Point(125, 9),
        Point(125, 22),
    )
    points += cubic(
        Point(125, 22),
        Point(125, 34),
        Point(115, 45),
        Point(102, 45),
    )
    points += [
        Point(94, 45),
    ]
    points += cubic(
        Point(94, 45),
        Point(86, 45),
        Point(82, 40),
        Point(82, 33),
    )
    points += [
        Point(82, 30),
    ]
    points += cubic(
        Point(82, 30),
        Point(82, 26),
        Point(79, 24),
        Point(75, 24),
    )
    points += [
        Point(28, 24),
    ]
    points += cubic(
        Point(28, 24),
        Point(22, 24),
        Point(18, 28),
        Point(18, 34),
    )
    points += [
        Point(18, 37),
    ]
    points += cubic(
        Point(18, 37),
        Point(18, 42),
        Point(15, 45),
        Point(10, 45),
    )
    points += [
        Point(0, 45),
    ]
    return points


def polyline_path(points: list[Point], close: bool = True) -> str:
    commands = [f"M {fmt(points[0].x)} {fmt(points[0].y)}"]
    commands.extend(f"L {fmt(point.x)} {fmt(point.y)}" for point in points[1:])
    if close:
        commands.append("Z")
    return " ".join(commands)


def profile_svg() -> str:
    outline = outline_points()
    slot = transformed_slot_points(Point(84, 12), G.slot_length, G.slot_width, G.slot_angle_degrees)
    hole = circle_points(Point(103, 36), G.lower_hole_diameter)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="125mm" height="45mm" viewBox="0 0 125 45">
  <title>Tablet mount laser-cut profile</title>
  <desc>Clean 2D cutting profile interpreted from the hand sketch. Units are millimeters.</desc>
  <g fill="none" stroke="black" stroke-width="0.2" vector-effect="non-scaling-stroke">
    <path id="outer-profile" d="{polyline_path(outline)}" />
    <path id="top-slot" d="{polyline_path(slot)}" />
    <path id="lower-hole" d="{polyline_path(hole)}" />
  </g>
</svg>
"""


def dimension_line(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    label: str,
    text_x: float,
    text_y: float,
    rotate: bool = False,
) -> str:
    transform = f' transform="rotate(-90 {fmt(text_x)} {fmt(text_y)})"' if rotate else ""
    return f"""
    <line x1="{fmt(x1)}" y1="{fmt(y1)}" x2="{fmt(x2)}" y2="{fmt(y2)}" class="dimension" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="{fmt(text_x)}" y="{fmt(text_y)}" class="dimension-label"{transform}>{label}</text>"""


def dimensioned_svg() -> str:
    outline = outline_points()
    slot = transformed_slot_points(Point(84, 12), G.slot_length, G.slot_width, G.slot_angle_degrees)
    hole = circle_points(Point(103, 36), G.lower_hole_diameter)
    assumptions = [
        "Units: mm",
        "Overall length: 125",
        "Overall height: 45",
        "Lower hole: diameter 2",
        "Upper slot: 59 x 2, angled 8 deg",
        "Material thickness noted from sketch: 2",
        "Radii/slot position interpreted from sketch; confirm before laser cutting.",
    ]
    notes = "\n".join(
        f'    <text x="146" y="{16 + index * 5}" class="note">{note}</text>'
        for index, note in enumerate(assumptions)
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="95mm" viewBox="-12 -18 210 95">
  <title>Tablet mount dimensioned 2D drawing</title>
  <desc>Dimensioned drawing converted from a manual sketch. Units are millimeters.</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f2937" />
    </marker>
    <style>
      .cut {{ fill: none; stroke: #111827; stroke-width: 0.6; }}
      .construction {{ fill: none; stroke: #9ca3af; stroke-width: 0.25; stroke-dasharray: 1.5 1.5; }}
      .dimension {{ stroke: #1f2937; stroke-width: 0.25; }}
      .extension {{ stroke: #6b7280; stroke-width: 0.2; }}
      .dimension-label {{ fill: #111827; font-family: Arial, sans-serif; font-size: 4px; text-anchor: middle; }}
      .note {{ fill: #111827; font-family: Arial, sans-serif; font-size: 3.8px; }}
      .title {{ fill: #111827; font-family: Arial, sans-serif; font-size: 6px; font-weight: 700; }}
      .subtitle {{ fill: #374151; font-family: Arial, sans-serif; font-size: 3.6px; }}
    </style>
  </defs>
  <rect x="-12" y="-18" width="210" height="95" fill="#ffffff" />
  <g id="geometry">
    <path class="cut" d="{polyline_path(outline)}" />
    <path class="cut" d="{polyline_path(slot)}" />
    <path class="cut" d="{polyline_path(hole)}" />
    <line x1="0" y1="0" x2="125" y2="0" class="construction" />
    <line x1="0" y1="45" x2="125" y2="45" class="construction" />
    <line x1="0" y1="0" x2="0" y2="45" class="construction" />
    <line x1="125" y1="0" x2="125" y2="45" class="construction" />
  </g>
  <g id="dimensions">
    <line x1="0" y1="45" x2="0" y2="58" class="extension" />
    <line x1="125" y1="22" x2="125" y2="58" class="extension" />
    {dimension_line(0, 56, 125, 56, "125 overall", 62.5, 54)}
    <line x1="125" y1="0" x2="137" y2="0" class="extension" />
    <line x1="102" y1="45" x2="137" y2="45" class="extension" />
    {dimension_line(135, 0, 135, 45, "45 overall", 139, 22.5, rotate=True)}
    <line x1="103" y1="36" x2="131" y2="36" class="dimension" marker-end="url(#arrow)" />
    <text x="143" y="37.3" class="dimension-label">diameter 2 hole</text>
    <line x1="84" y1="12" x2="133" y2="13" class="dimension" marker-end="url(#arrow)" />
    <text x="152" y="14.5" class="dimension-label">59 x 2 slot</text>
  </g>
  <text x="0" y="-8" class="title">Tablet mount - converted 2D drawing</text>
  <text x="0" y="-2" class="subtitle">Interpreted from supplied manual sketch for laser-cut review.</text>
  <g id="notes">
{notes}
  </g>
</svg>
"""


def dxf_polyline(layer: str, points: list[Point], close: bool = True) -> list[str]:
    flags = 1 if close else 0
    lines = [
        "0",
        "POLYLINE",
        "8",
        layer,
        "66",
        "1",
        "70",
        str(flags),
    ]
    for point in points:
        lines.extend(
            [
                "0",
                "VERTEX",
                "8",
                layer,
                "10",
                fmt(point.x),
                "20",
                fmt(point.y),
                "30",
                "0",
            ]
        )
    lines.extend(["0", "SEQEND", "8", layer])
    return lines


def dxf() -> str:
    entities: list[str] = []
    entities.extend(dxf_polyline("CUT_OUTER", outline_points()))
    entities.extend(
        dxf_polyline(
            "CUT_SLOT",
            transformed_slot_points(Point(84, 12), G.slot_length, G.slot_width, G.slot_angle_degrees),
        )
    )
    entities.extend(dxf_polyline("CUT_HOLE", circle_points(Point(103, 36), G.lower_hole_diameter)))
    body = "\n".join(entities)
    return f"""0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
3
0
LAYER
2
CUT_OUTER
70
0
62
7
6
CONTINUOUS
0
LAYER
2
CUT_SLOT
70
0
62
1
6
CONTINUOUS
0
LAYER
2
CUT_HOLE
70
0
62
5
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
{body}
0
ENDSEC
0
EOF
"""


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "tablet_mount_profile.svg").write_text(profile_svg(), encoding="utf-8")
    (OUT_DIR / "tablet_mount_dimensioned.svg").write_text(dimensioned_svg(), encoding="utf-8")
    (OUT_DIR / "tablet_mount_profile.dxf").write_text(dxf(), encoding="utf-8")


if __name__ == "__main__":
    main()
