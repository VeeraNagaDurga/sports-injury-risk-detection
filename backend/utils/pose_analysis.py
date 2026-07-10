import math

def calculate_angle(a, b, c):
    """
    Calculate the angle between three points.
    a, b, c are (x, y) coordinates.
    """

    angle = math.degrees(
        math.atan2(c[1] - b[1], c[0] - b[0]) -
        math.atan2(a[1] - b[1], a[0] - b[0])
    )

    angle = abs(angle)

    if angle > 180:
        angle = 360 - angle

    return round(angle, 2)