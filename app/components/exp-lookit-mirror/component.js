// component.js

import ExpLookitWebcamDisplay from '../exp-lookit-webcam-display/component';
import { on } from '@ember/object/evented';
import layout from './template'; // Import the template layout

/**
 * A frame that extends exp-lookit-webcam-display but adds a fullscreen mirrored camera,
 * background music, a countdown timer, and an early exit option.
 *
 * @class Exp-lookit-mirror
 * @extends Exp-lookit-webcam-display
 */

export default ExpLookitWebcamDisplay.extend({
    layout, // Use the imported layout
    type: 'exp-lookit-mirror',

    // Properties for timer and early exit
    timer: null,
    timeLeft: 0,
    showExitConfirmation: false,

    // Audio player property
    audioPlayer: null,

    // Define all parameters for this frame. This is crucial for Lookit to
    // pass the values from your JSON config to the component.
    frameSchemaProperties: {
        // Inherit properties from the base webcam-display frame
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
        instructionText: {
            type: 'string',
            description: 'Text to display at the bottom of the screen',
            default: ''
        },
        forceFullscreen: {
            type: 'boolean',
            description: 'Whether to automatically enter fullscreen mode upon frame load',
            default: true
        }
        // Note: nextButtonText and showPreviousButton are already inherited
    },

    // This function runs once the component's element has been inserted into the DOM.
    didInsertElement() {
        this._super(...arguments);
        this.set('timeLeft', this.get('duration'));

        // Attempt to force fullscreen if specified
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
        // Clean up everything to prevent memory leaks
        this._stopAudio();
        clearInterval(this.get('timer'));
        this._removeKeyListener();
    },

    // Sets up and starts the background music
    _setupAudio() {
        const songUrl = this.get('songUrl');
        if (songUrl) {
            console.log('[MirrorFrame] Setting up audio with URL:', songUrl);
            const audio = new Audio(songUrl);
            audio.loop = true;
            audio.play().catch(e => console.error('[MirrorFrame] Audio play error:', e));
            this.set('audioPlayer', audio);
        }
    },

    // Stops the background music
    _stopAudio() {
        const audio = this.get('audioPlayer');
        if (audio) {
            audio.pause();
            this.set('audioPlayer', null);
        }
    },

    // Sets up the countdown timer
    _setupTimer() {
        const timer = setInterval(() => {
            this.decrementProperty('timeLeft');
            if (this.get('timeLeft') <= 0) {
                // Use the 'proceed' action which is the standard in webcam-display
                this.send('proceed');
            }
        }, 1000);
        this.set('timer', timer);
    },

    // Adds a keyboard listener to listen for the 'E' key for early exit
    _setupKeyListener() {
        // Using a bound function to ensure 'this' context is correct
        this.handleKey = (e) => {
            if (e.key === 'e' || e.key === 'E') {
                this.set('showExitConfirmation', true);
            }
        };
        document.addEventListener('keydown', this.handleKey);
    },

    // Removes the keyboard listener during cleanup
    _removeKeyListener() {
        if (this.handleKey) {
            document.removeEventListener('keydown', this.handleKey);
        }
    },

    actions: {
        // The 'proceed' action is inherited from the base frame.
        // We override it here to add our cleanup logic first.
        proceed() {
            console.log('[MirrorFrame] Proceeding to next frame.');
            // Stop everything before moving on
            clearInterval(this.get('timer'));
            this._stopAudio();

            // Save the final duration
            this.set('completedDuration', this.get('duration') - this.get('timeLeft'));
            this.send('setTimeEvent', 'mirrorTrial.stopped', {
                duration: this.get('completedDuration')
            });

            // Call the original 'proceed' action from the parent class
            // This will handle stopping the recorder and moving to the next frame.
            this._super(...arguments);
        },

        // Action to confirm exiting the trial early
        confirmExit() {
            this.set('showExitConfirmation', false);
            this.send('proceed'); // Use the standard action to exit
        },

        // Action to cancel exiting the trial
        cancelExit() {
            this.set('showExitConfirmation', false);
        }
    }
});

