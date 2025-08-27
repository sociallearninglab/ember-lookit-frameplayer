// component.js

import ExpLookitWebcamDisplay from '../exp-lookit-webcam-display/component';
import { on } from '@ember/object/evented';
import { computed } from '@ember/object';
import layout from './template';

/**
 * A frame that extends exp-lookit-webcam-display but adds a fullscreen mirrored camera,
 * background music, a countdown timer, and an early exit option.
 *
 * @class Exp-lookit-mirror
 * @extends Exp-lookit-webcam-display
 */

export default ExpLookitWebcamDisplay.extend({
    layout,
    type: 'exp-lookit-mirror',

    // Properties for timer and early exit
    timer: null,
    timeLeft: 0,
    showExitConfirmation: false,

    // Audio player property
    audioPlayer: null,

    // The schema defines the parameters that can be set for this frame in the study JSON.
    frameSchemaProperties: {
        ...ExpLookitWebcamDisplay.prototype.frameSchemaProperties,
        songUrl: {
            type: 'string',
            description: 'URL for background music to play during display',
            default: ''
        },
        duration: {
            type: 'number',
            description: 'The duration in seconds that the mirror will be displayed',
            default: 180
        },
        forceFullscreen: {
            type: 'boolean',
            description: 'Whether to automatically enter fullscreen mode upon frame load',
            default: true
        }
    },

    // This function runs once the component's element has been inserted into the DOM.
    didInsertElement() {
        this._super(...arguments);
        this.set('timeLeft', this.get('duration'));

        if (this.get('forceFullscreen')) {
            this.send('displayFullscreen');
        }

        this._setupAudio();
        this._setupTimer();
        this._setupKeyListener();
    },

    // This function runs just before the component is removed from the DOM.
    willDestroyElement() {
        this._super(...arguments);
        this._stopAudio();
        clearInterval(this.get('timer'));
        this._removeKeyListener();
    },

    // Sets up and starts the background music.
    _setupAudio() {
        const songUrl = this.get('songUrl');
        if (songUrl) {
            const audio = new Audio(songUrl);
            audio.loop = true;
            audio.play().catch(e => console.error('[MirrorFrame] Audio play error:', e));
            this.set('audioPlayer', audio);
        }
    },

    // Stops and cleans up the audio player.
    _stopAudio() {
        const audio = this.get('audioPlayer');
        if (audio) {
            audio.pause();
            this.set('audioPlayer', null);
        }
    },

    // Sets up the timer that will automatically advance the frame.
    // This still runs even though it's not displayed.
    _setupTimer() {
        const timer = setInterval(() => {
            this.decrementProperty('timeLeft');
            if (this.get('timeLeft') <= 0) {
                this.send('proceed');
            }
        }, 1000);
        this.set('timer', timer);
    },

    // Adds a keyboard listener for the early exit key ('E').
    _setupKeyListener() {
        this.handleKey = (e) => {
            if (e.key === 'e' || e.key === 'E') {
                this.set('showExitConfirmation', true);
            }
        };
        document.addEventListener('keydown', this.handleKey);
    },

    // Removes the keyboard listener during cleanup.
    _removeKeyListener() {
        if (this.handleKey) {
            document.removeEventListener('keydown', this.handleKey);
        }
    },

    actions: {
        // This action handles advancing to the next frame.
        proceed() {
            clearInterval(this.get('timer'));
            this._stopAudio();
            this.set('completedDuration', this.get('duration') - this.get('timeLeft'));
            this.send('setTimeEvent', 'mirrorTrial.stopped', {
                duration: this.get('completedDuration')
            });
            this._super(...arguments);
        },
        // Action to confirm exiting the trial early.
        confirmExit() {
            this.set('showExitConfirmation', false);
            this.send('proceed');
        },
        // Action to cancel exiting the trial.
        cancelExit() {
            this.set('showExitConfirmation', false);
        }
    }
});