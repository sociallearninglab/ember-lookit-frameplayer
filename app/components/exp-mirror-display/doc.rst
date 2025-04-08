exp-lookit-mirror
================

Overview
------------------

This frame extends ``exp-lookit-webcam-display`` to create a mirror experience with additional features:

1. Automatic mirroring of the webcam feed (horizontal flip)
2. Background music playback
3. Countdown timer display
4. Option to force fullscreen mode
5. Early exit option by pressing 'E' key
6. Custom instruction text at the bottom of screen

Example usage
~~~~~~~~~~~~~~~~~~~

.. code:: json

    "mirror-trial": {
        "kind": "exp-lookit-mirror",
        "blocks": [
            {
                "title": "Look who it is!"
            }
        ],
        "nextButtonText": "Done",
        "showPreviousButton": false,
        "displayFullscreenOverride": true,
        "forceFullscreen": true,
        "duration": 180,
        "songUrl": "https://github.com/sociallearninglab/baby_view_baby/raw/refs/heads/main/mp3/song.mp3",
        "instructionText": "Look who it is!"
    }


Parameters
----------------

blocks [Array | ``[]``]
    Array of blocks for exp-text-block, specifying text/images of instructions to display. These will be hidden by default due to the CSS styling of this frame.

nextButtonText [String | ``"Next"``]
    Text to display on the 'next frame' button

showPreviousButton [Boolean | ``false``]
    Whether to show a 'previous' button

displayFullscreenOverride [Boolean | ``true``]
    Whether to display this frame fullscreen

forceFullscreen [Boolean | ``true``]
    Whether to automatically enter fullscreen mode upon frame load

duration [Number | ``180``]
    The duration in seconds that the mirror will be displayed before automatically proceeding

songUrl [String | ``""``]
    URL for the background music to play during the mirror display

instructionText [String | ``"Look who it is!"``]
    Text to display at the bottom of the screen during the mirror display

Data collected
----------------

videoId [String]
    Identifier of any video recorded during this frame

completedDuration [Number]
    How long, in seconds, the mirror was displayed before proceeding to the next frame. This may be less than the specified duration if the user exits early.

Events recorded
----------------

:none: No events are recorded specifically for this frame beyond those recorded by exp-lookit-webcam-display.