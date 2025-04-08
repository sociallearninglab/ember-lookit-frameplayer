exp-mirror-display
================

Overview
------------------

This frame displays a 'mirror' to the child by showing the webcam feed. It includes a timer, background music, and the option for an early exit.

The frame also records the webcam feed if the ``doRecording`` parameter is set to ``true``.

Example usage
~~~~~~~~~~~~~~~~~~~

.. code:: json

    "mirror-trial": {
        "kind": "exp-mirror-display",
        "duration": 180,
        "songUrl": "https://github.com/sociallearninglab/baby_view_baby/raw/refs/heads/main/mp3/song.mp3",
        "instructionText": "Look who it is!",
        "doRecording": true,
        "displayFullscreen": true
    }


Parameters
----------------

duration [Number | ``180``]
    The duration in seconds that the mirror will be displayed before automatically proceeding.

songUrl [String | ``"https://github.com/sociallearninglab/baby_view_baby/raw/refs/heads/main/mp3/song.mp3"``]
    URL for the background music to play during the mirror display.

instructionText [String | ``"Look who it is!"``]
    Text to display at the bottom of the screen during the mirror display.

doRecording [Boolean | ``true``]
    Whether to record video during this frame.

displayFullscreen [Boolean | ``true``]
    Whether to display this frame in fullscreen mode.

Data collected
----------------

completedDuration [Number]
    How long, in seconds, the mirror was displayed before proceeding to the next frame. This may be less than the specified duration if the user exits early.

Events recorded
----------------

:none: No events are recorded specifically for this frame.